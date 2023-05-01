import { createHash } from 'crypto';
import { join, basename } from 'path';
import { Annotations, CfnResource, CustomResource, Duration } from 'aws-cdk-lib';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { BuildSpec, LinuxBuildImage, Project } from 'aws-cdk-lib/aws-codebuild';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, RuntimeFamily, SingletonFunction } from 'aws-cdk-lib/aws-lambda';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset, AssetProps } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { ResourceProperties } from './types';

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
   * The version of Node.js to use in a build environment. Available versions: 12, 14, 16, 18.
   * @default 18
   */
  readonly nodejsVersion?: number;
}

export class NodejsBuild extends Construct {
  constructor(scope: Construct, id: string, props: NodejsBuildProps) {
    super(scope, id);

    const handler = new SingletonFunction(this, 'CustomResourceHandler', {
      // Use raw string to avoid from tightening CDK version requirement
      runtime: new Runtime('nodejs18.x', RuntimeFamily.NODEJS),
      code: Code.fromAsset(join(__dirname, '../lambda/nodejs-build/dist')),
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
        buildImage = 'aws/codebuild/standard:7.0';
        break;
      default:
        Annotations.of(this).addError(`Unsupported Node.js version: ${nodejsVersion}`);
    }

    const project = new Project(this, 'Project', {
      environment: { buildImage: LinuxBuildImage.STANDARD_6_0 },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: nodejsVersion,
            },
          },
          build: {
            commands: [
              'current_dir=$(pwd)',
              `
for obj in $(echo "$input" | jq -c '.[]'); do
  assetUrl=$(echo "$obj" | jq -r '.assetUrl')
  extractPath=$(echo "$obj" | jq -r '.extractPath')
  commands=$(echo "$obj" | jq -r '.commands')

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
              'zip -r output.zip ./',
              'aws s3 cp output.zip "s3://$destinationBucketName/$destinationObjectKey"',
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
  "PhysicalResourceId": "$destinationObjectKey",
  "Status": "$STATUS",
  "Reason": "$REASON"
}
EOF
curl -vv -i -X PUT -H 'Content-Type:' -d "@payload.json" "$responseURL"
              `,
            ],
          },
        },
      }),
    });

    (project.node.defaultChild as CfnResource).addPropertyOverride('Environment.Image', buildImage);

    handler.addToRolePolicy(
      new PolicyStatement({
        actions: ['codebuild:StartBuild'],
        resources: [project.projectArn],
      }),
    );

    let assetHash = 'nodejsBuild';
    const assets = props.assets.map((assetProps) => {
      const asset = new Asset(this, `Source-${assetProps.path.replace('/', '')}`, {
        ...assetProps,
      });
      assetHash += asset.assetHash;
      asset.grantRead(project);
      return asset;
    });

    // generate a new asset hash that includes all the assets specified.
    const md5 = createHash('md5');
    assetHash = md5.update(assetHash).digest('hex');

    // use the asset bucket that are created by CDK bootstrap to store intermediate artifacts
    const bucket = assets[0].bucket;
    bucket.grantWrite(project);

    const sources: ResourceProperties['sources'] = props.assets.map((s, i) => ({
      sourceBucketName: assets[i].s3BucketName,
      sourceObjectKey: assets[i].s3ObjectKey,
      extractPath: s.extractPath ?? basename(s.path),
      commands: s.commands,
    }));

    const properties: ResourceProperties = {
      sources,
      destinationBucketName: bucket.bucketName,
      destinationObjectKey: `${assetHash}.zip`,
      workingDirectory: sources[0].extractPath,
      outputSourceDirectory: join(sources[0].extractPath, props.outputSourceDirectory),
      environment: props.buildEnvironment,
      buildCommands: props.buildCommands ?? ['npm run build'],
      codeBuildProjectName: project.projectName,
    };

    const custom = new CustomResource(this, 'Resource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKNodejsBuild',
      properties,
    });

    const deploy = new BucketDeployment(this, 'Deploy', {
      sources: [Source.bucket(bucket, properties.destinationObjectKey)],
      destinationBucket: props.destinationBucket,
      destinationKeyPrefix: props.destinationKeyPrefix,
      distribution: props.distribution,
    });

    deploy.node.addDependency(custom);
  }
}
