import { basename, join, posix } from 'path';
import { Annotations, CfnOutput, CustomResource, Duration } from 'aws-cdk-lib';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { BuildSpec, LinuxBuildImage, Project } from 'aws-cdk-lib/aws-codebuild';
import { IGrantable, IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, RuntimeFamily, SingletonFunction } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset, AssetProps } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { NodejsBuildResourceProps } from './types';

export interface AssetConfig extends AssetProps {
  /**
   * Shell commands executed right after the asset zip is extracted to the build environment.
   * @default No command is executed.
   */
  readonly commands?: string[];

  /**
   * Relative path from a build directory to the directory where the asset is extracted.
   * @default basename of the asset path.
   */
  readonly extractPath?: string;
}

export interface NodejsBuildProps {
  /**
   * The AssetProps from which s3-assets are created and copied to the build environment.
   */
  readonly assets: AssetConfig[];
  /**
   * Environment variables injected to the build environment.
   * You can use CDK deploy-time values as well as literals.
   * @default {}
   */
  readonly buildEnvironment?: { [key: string]: string };
  /**
   * S3 Bucket to which your build artifacts are finally deployed.
   */
  readonly destinationBucket: IBucket;
  /**
   * Key prefix to deploy your build artifact.
   * @default '/'
   */
  readonly destinationKeyPrefix?: string;
  /**
   * The distribution you are using to publish you build artifact.
   * If any specified, the caches are invalidated on new artifact deployments.
   * @default No distribution
   */
  readonly distribution?: IDistribution;
  /**
   * Shell commands to build your project. They are executed on the working directory you specified.
   * @default ['npm run build']
   */
  readonly buildCommands?: string[];
  /**
   * Relative path from the build directory to the directory where build commands run.
   * @default assetProps[0].extractPath
   */
  readonly workingDirectory?: string;
  /**
   * Relative path from the working directory to the directory where the build artifacts are output.
   */
  readonly outputSourceDirectory: string;
  /**
   * The version of Node.js to use in a build environment. Available versions: 12, 14, 16, 18, 20, and 22.
   * @default 18
   */
  readonly nodejsVersion?: number;
  /**
   * If true, a .env file is uploaded to an S3 bucket with values of `buildEnvironment` property.
   * You can copy it to your local machine by running the command in the stack output.
   * @default false
   */
  readonly outputEnvFile?: boolean;
  /**
   * If true, common unnecessary files/directories such as .DS_Store, .git, node_modules, etc are excluded
   * from the assets by default.
   * @default true
   */
  readonly excludeCommonFiles?: boolean;
}

/**
 * Build Node.js app and optionally publish the artifact to an S3 bucket.
 */
export class NodejsBuild extends Construct implements IGrantable {
  public readonly grantPrincipal: IPrincipal;

  constructor(scope: Construct, id: string, props: NodejsBuildProps) {
    super(scope, id);

    const handler = new SingletonFunction(this, 'CustomResourceHandler', {
      // Use raw string to avoid from tightening CDK version requirement
      runtime: new Runtime('nodejs22.x', RuntimeFamily.NODEJS),
      code: Code.fromAsset(join(__dirname, '..', 'lambda', 'trigger-codebuild', 'dist')),
      handler: 'index.handler',
      uuid: '25648b21-2c40-4f09-aa65-b6bbb0c44659', // generated for this construct
      lambdaPurpose: 'NodejsBuildCustomResourceHandler',
      timeout: Duration.minutes(5),
    });

    const nodejsVersion = props.nodejsVersion ?? 18;
    let buildImage = 'aws/codebuild/standard:7.0';
    // See: https://docs.aws.amazon.com/codebuild/latest/userguide/available-runtimes.html#linux-runtimes
    switch (nodejsVersion) {
      case 12:
      case 14:
        buildImage = 'aws/codebuild/standard:5.0';
        break;
      case 16:
        buildImage = 'aws/codebuild/standard:6.0';
        break;
      case 18:
      case 20:
      case 22:
        buildImage = 'aws/codebuild/standard:7.0';
        break;
      default:
        Annotations.of(this).addWarning(`Possibly unsupported Node.js version: ${nodejsVersion}. Currently 12, 14, 16, 18, 20, and 22 are supported.`);
    }

    const outputEnvFile = props.outputEnvFile ?? false;
    const envFileKeyOutputKey = 'envFileKey';

    const project = new Project(this, 'Project', {
      environment: { buildImage: LinuxBuildImage.fromCodeBuildImageId(buildImage) },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        env: {
          shell: 'bash',
        },
        phases: {
          install: {
            'runtime-versions': {
              nodejs: nodejsVersion,
            },
          },
          build: {
            commands: [
              'current_dir=$(pwd)',
              // Iterate a json array using jq
              // https://www.starkandwayne.com/blog/bash-for-loop-over-json-array-using-jq/index.html
              `
echo "$input"
for obj in $(echo "$input" | jq -r '.[] | @base64'); do
  decoded=$(echo "$obj" | base64 --decode)
  assetUrl=$(echo "$decoded" | jq -r '.assetUrl')
  extractPath=$(echo "$decoded" | jq -r '.extractPath')
  commands=$(echo "$decoded" | jq -r '.commands')

  # Download the zip file
  aws s3 cp "$assetUrl" temp.zip

  # Extract the zip file to the extractPath directory
  mkdir -p "$extractPath"
  unzip temp.zip -d "$extractPath"

  # Remove the zip file
  rm temp.zip

  # Run the specified commands in the extractPath directory
  cd "$extractPath"
  ls -la
  eval "$commands"
  cd "$current_dir"
  ls -la
done
              `,
              'ls -la',
              'cd "$workingDirectory"',
              'eval "$buildCommands"',
              'ls -la',
              'cd "$current_dir"',
              'cd "$outputSourceDirectory"',
              'aws s3 sync . "s3://$destinationBucketName/$destinationKeyPrefix" --delete',
              // Invalidate CloudFront cache if distribution is specified
              `
if [[ -n "$distributionId" ]]
then
INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation --distribution-id "$distributionId" --paths "$distributionPath" --output json)
INVALIDATION_ID=$(echo "$INVALIDATION_OUTPUT" | jq -r '.Invalidation.Id')
aws cloudfront wait invalidation-completed --distribution-id "$distributionId" --id "$INVALIDATION_ID"
fi
`,
              // Upload .env if required
              `
if [[ $outputEnvFile == "true" ]]
then
  # Split the comma-separated string into an array
  for var_name in \${envNames//,/ }
  do
      echo "Element: $var_name"
      var_value="\${!var_name}"
      echo "$var_name=$var_value" >> tmp.env
  done

  aws s3 cp tmp.env "s3://$assetBucketName/$envFileKey"
fi
              `,
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              `
STATUS='SUCCESS'
if [ $CODEBUILD_BUILD_SUCCEEDING -ne 1 ] # Test if the build is failing
then
STATUS='FAILED'
REASON="NodejsBuild failed. See CloudWatch Log stream for the detailed reason: 
https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\\$252Faws\\$252Fcodebuild\\$252F$projectName/log-events/$CODEBUILD_LOG_PATH"
fi
cat <<EOF > payload.json
{
  "StackId": "$stackId",
  "RequestId": "$requestId",
  "LogicalResourceId":"$logicalResourceId",
  "PhysicalResourceId": "$logicalResourceId",
  "Status": "$STATUS",
  "Reason": "$REASON",
  "Data": {
    "${envFileKeyOutputKey}": "$envFileKey"
  }
}
EOF
curl -i -X PUT -H 'Content-Type:' -d "@payload.json" "$responseURL"
              `,
            ],
          },
        },
      }),
    });

    handler.addToRolePolicy(
      new PolicyStatement({
        actions: ['codebuild:StartBuild'],
        resources: [project.projectArn],
      })
    );

    this.grantPrincipal = project.grantPrincipal;

    props.destinationBucket.grantReadWrite(project);
    if (props.distribution) {
      project.addToRolePolicy(
        new PolicyStatement({
          actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
          resources: [props.distribution.distributionArn],
        })
      );
    }

    const commonExclude = ['.DS_Store', '.git', 'node_modules'];
    const assets = props.assets.map((assetProps) => {
      const asset = new Asset(this, `Source-${assetProps.path.replace('/', '')}`, {
        ...assetProps,
        ...(props.excludeCommonFiles ?? true ? { exclude: [...commonExclude, ...(assetProps.exclude ?? [])] } : {}),
      });
      asset.grantRead(project);
      return asset;
    });

    const bucket = assets[0].bucket;
    if (outputEnvFile) {
      // use the asset bucket that are created by CDK bootstrap to store .env file
      bucket.grantWrite(project);
    }

    const sources: NodejsBuildResourceProps['sources'] = props.assets.map((s, i) => ({
      sourceBucketName: assets[i].s3BucketName,
      sourceObjectKey: assets[i].s3ObjectKey,
      extractPath: s.extractPath ?? basename(s.path),
      commands: s.commands,
    }));

    const workingDirectory = props.workingDirectory ?? sources[0].extractPath;
    const properties: NodejsBuildResourceProps = {
      type: 'NodejsBuild',
      sources,
      destinationBucketName: props.destinationBucket.bucketName,
      destinationKeyPrefix: props.destinationKeyPrefix ?? '/',
      distributionId: props.distribution?.distributionId,
      assetBucketName: bucket.bucketName,
      workingDirectory,
      // join paths for CodeBuild (Linux) platform
      outputSourceDirectory: posix.join(workingDirectory, props.outputSourceDirectory),
      environment: props.buildEnvironment,
      buildCommands: props.buildCommands ?? ['npm run build'],
      codeBuildProjectName: project.projectName,
      outputEnvFile,
    };

    const custom = new CustomResource(this, 'Resource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKNodejsBuild',
      properties,
    });

    if (props.outputEnvFile) {
      new CfnOutput(this, 'DownloadEnvFile', { value: `aws s3 cp ${bucket.s3UrlForObject(custom.getAttString(envFileKeyOutputKey))} .env.local` });
    }
  }
}
