import { Annotations, CfnOutput, CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { BuildSpec, Cache, ComputeType, LinuxBuildImage, LocalCacheMode, Project } from 'aws-cdk-lib/aws-codebuild';
import { IGrantable, IPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, RuntimeFamily, SingletonFunction } from 'aws-cdk-lib/aws-lambda';
import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset, AssetOptions, AssetProps } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { basename, join, posix } from 'path';
import { NodejsBuildResourceProps } from './types';

export { ComputeType } from 'aws-cdk-lib/aws-codebuild';

/**
 * Cache type for NodejsBuild.
 */
export enum CacheType {
  /**
   * S3 caching. Stores the npm cache directory in an S3 bucket.
   * Good for builds that run on different hosts.
   */
  S3 = 'S3',
  /**
   * Local caching. Stores the npm cache directory on the build host.
   * Faster than S3 but only effective if builds run on the same host.
   * Not supported with VPC or certain compute types.
   */
  LOCAL = 'LOCAL',
}

const COMMON_EXCLUDE = ['.DS_Store', '.git', 'node_modules'];

interface SourceConfig {
  readonly bucket: IBucket;
  readonly key: string;
  readonly extractPath: string;
  readonly commands?: string[];
}

interface BindOptions {
  readonly excludeCommonFiles?: boolean;
}

/**
 * Common options for all source types.
 */
export interface SourceOptions {
  /**
   * Shell commands executed right after the source is extracted to the build environment.
   * @default No command is executed.
   */
  readonly commands?: string[];

  /**
   * Relative path from the build directory to the directory where the source is extracted.
   * @default '.' (extracts to the root of the build directory)
   */
  readonly extractPath?: string;
}

/**
 * Options for Source.fromAsset
 */
export interface AssetSourceOptions extends AssetOptions, SourceOptions {
}

/**
 * Options for Source.fromBucket
 */
export interface BucketSourceOptions extends SourceOptions {
  /**
   * Optional S3 object version.
   * If not specified, the latest version will be used.
   * Note: If objectVersion is not defined, the build will not be updated automatically
   * if the source in the bucket is updated. This is because CDK/CloudFormation does not
   * track changes on the source S3 Bucket.
   * @default - latest version
   */
  readonly objectVersion?: string;
}

/**
 * Represents a source for NodejsBuild.
 */
export abstract class Source {
  /**
   * Loads the source from a local disk path.
   *
   * @param path Path to the asset file or directory
   * @param options Asset options including commands and extractPath
   */
  public static fromAsset(path: string, options?: AssetSourceOptions): Source {
    return new AssetSource(path, options);
  }

  /**
   * Uses a .zip file stored in an S3 bucket as the source for the build.
   *
   * Make sure you trust the producer of the archive.
   *
   * If the `bucket` parameter is an "out-of-app" reference "imported" via static methods such as
   * `s3.Bucket.fromBucketName`, be cautious about the bucket's encryption key. In general, CDK does
   * not query for additional properties of imported constructs at synthesis time. For example, for a
   * bucket created from `s3.Bucket.fromBucketName`, CDK does not know its `IBucket.encryptionKey`
   * property, and therefore will NOT give KMS permissions to the CodeBuild execution role. If you want
   * the `kms:Decrypt` and `kms:DescribeKey` permissions on the bucket's encryption key to be added
   * automatically, reference the imported bucket via `s3.Bucket.fromBucketAttributes` and pass in the
   * `encryptionKey` attribute explicitly.
   *
   * @param bucket The S3 bucket containing the source
   * @param zipObjectKey The object key within the bucket pointing to a .zip file
   * @param options Asset options including commands and extractPath
   *
   * @example
   *
   * declare const destinationBucket: s3.IBucket;
   * const sourceBucket = s3.Bucket.fromBucketAttributes(this, 'SourceBucket', {
   *   bucketArn: 'arn:aws:s3:::my-source-bucket-name',
   *   encryptionKey: kms.Key.fromKeyArn(
   *     this,
   *     'SourceBucketEncryptionKey',
   *     'arn:aws:kms:us-east-1:123456789012:key/<key-id>'
   *   ),
   * });
   *
   * new NodejsBuild(this, 'Build', {
   *   sources: [Source.fromBucket(sourceBucket, 'source.zip')],
   *   destinationBucket,
   *   outputSourceDirectory: 'dist',
   * });
   */
  public static fromBucket(bucket: IBucket, zipObjectKey: string, options?: BucketSourceOptions): Source {
    if (options?.objectVersion === undefined) {
      Annotations.of(bucket).addWarning(
        'objectVersion is not defined for Source.fromBucket(). The build will not be updated automatically if the source in the bucket is updated. ' +
        'This is because CDK/CloudFormation does not track changes on the source S3 Bucket. Consider using Source.fromAsset() instead or set objectVersion.',
      );
    }
    return new BucketSource(bucket, zipObjectKey, options);
  }

  /**
   * @internal
   */
  public abstract _bind(scope: Construct, id: string, options?: BindOptions): SourceConfig;
}

class AssetSource extends Source {
  constructor(
    private readonly path: string,
    private readonly options?: AssetSourceOptions
  ) {
    super();
  }

  public _bind(scope: Construct, id: string, options?: BindOptions): SourceConfig {
    const commonExclude = options?.excludeCommonFiles ? COMMON_EXCLUDE : [];

    const asset = new Asset(scope, id, {
      path: this.path,
      ...this.options,
      exclude: [...commonExclude, ...(this.options?.exclude ?? [])],
    });

    return {
      bucket: asset.bucket,
      key: asset.s3ObjectKey,
      extractPath: this.options?.extractPath ?? '.',
      commands: this.options?.commands,
    };
  }
}

class BucketSource extends Source {
  constructor(
    private readonly bucket: IBucket,
    private readonly zipObjectKey: string,
    private readonly options?: BucketSourceOptions
  ) {
    super();
  }

  public _bind(_scope: Construct, _id: string, _options?: BindOptions): SourceConfig {    
    return {
      bucket: this.bucket,
      key: this.zipObjectKey,
      extractPath: this.options?.extractPath ?? '.',
      commands: this.options?.commands,
    };
  }
}

/**
 * @deprecated Use Source.fromAsset() instead
 */
export interface AssetConfig extends AssetProps {
  /**
   * Shell commands executed right after the asset is extracted to the build environment.
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
   * The source directories for the build environment.
   * Use Source.fromAsset() to create sources.
   */
  readonly sources?: Source[];
  /**
   * The AssetProps from which s3-assets are created and copied to the build environment.
   * @deprecated Use sources property with Source.fromAsset() instead
   */
  readonly assets?: AssetConfig[];
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
   * @default The extractPath of the first source
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
  /**
   * Cache type for the npm cache directory.
   * @default - No caching
   */
  readonly cache?: CacheType;
  /**
   * The type of compute to use for this build.
   * @default ComputeType.SMALL
   */
  readonly computeType?: ComputeType;
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

    const cacheBucket = props.cache === CacheType.S3 ? new Bucket(this, 'CacheBucket', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    }) : undefined;

    const project = new Project(this, 'Project', {
      environment: {
        buildImage: LinuxBuildImage.fromCodeBuildImageId(buildImage),
        computeType: props.computeType,
      },
      ...(cacheBucket && { cache: Cache.bucket(cacheBucket) }),
      ...(props.cache === CacheType.LOCAL && { cache: Cache.local(LocalCacheMode.CUSTOM) }),
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
        ...(props.cache && {
          cache: {
            paths: ['/root/.npm/**/*'],
          },
        }),
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
          resources: [
            Stack.of(props.distribution).formatArn({
              service: 'cloudfront',
              region: '',
              resource: 'distribution',
              resourceName: props.distribution.distributionId,
            }),
          ],
        }),
      );
    }

    // Validate that either sources or assets is provided, but not both
    if (props.sources && props.assets) {
      throw new Error('Cannot specify both "sources" and "assets". Use "sources" with Source.fromAsset().');
    }
    if (!props.sources && !props.assets) {
      throw new Error('Either "sources" or "assets" must be specified.');
    }

    let boundSources: SourceConfig[];
    if (props.sources) {
      // New API: use Source objects
      boundSources = props.sources.map((source, index) => {
        const boundSource = source._bind(this, `Source${index}`, { excludeCommonFiles: props.excludeCommonFiles });
        boundSource.bucket.grantRead(project);
        return boundSource;
      });
    } else {
      // Deprecated API: use assets
      Annotations.of(this).addWarning('The "assets" property is deprecated. Use "sources" with Source.fromAsset() instead.');
      const commonExclude = props.excludeCommonFiles ? COMMON_EXCLUDE : [];
      boundSources = props.assets!.map((assetProps, index) => {
        const asset = new Asset(this, `Source${index}`, {
          ...assetProps,
          exclude: [...commonExclude, ...(assetProps.exclude ?? [])],
        });
        asset.grantRead(project);
        return {
          bucket: asset.bucket,
          key: asset.s3ObjectKey,
          extractPath: assetProps.extractPath ?? basename(assetProps.path),
          commands: assetProps.commands,
        };
      });
    }

    const assetBucket = boundSources[0].bucket;
    if (outputEnvFile) {
      // use the asset bucket that are created by CDK bootstrap to store .env file
      assetBucket.grantWrite(project);
    }

    const sources: NodejsBuildResourceProps['sources'] = boundSources.map((source) => ({
      sourceBucketName: source.bucket.bucketName,
      sourceObjectKey: source.key,
      extractPath: source.extractPath,
      commands: source.commands,
    }));

    const workingDirectory = props.workingDirectory ?? sources[0].extractPath;
    const properties: NodejsBuildResourceProps = {
      type: 'NodejsBuild',
      sources,
      destinationBucketName: props.destinationBucket.bucketName,
      destinationKeyPrefix: props.destinationKeyPrefix ?? '/',
      distributionId: props.distribution?.distributionId,
      assetBucketName: assetBucket.bucketName,
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
    if (project.role) {
      custom.node.addDependency(project.role);
    }

    if (props.outputEnvFile) {
      new CfnOutput(this, 'DownloadEnvFile', { value: `aws s3 cp ${assetBucket.s3UrlForObject(custom.getAttString(envFileKeyOutputKey))} .env.local` });
    }
  }
}
