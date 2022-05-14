import { createHash } from 'crypto';
import { join } from 'path';
import { CustomResource, Duration, RemovalPolicy, Size } from 'aws-cdk-lib';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, BucketEncryption, IBucket } from 'aws-cdk-lib/aws-s3';
import { Asset, AssetProps } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, BucketDeploymentProps, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { ResourceProperties } from './lambda/types';

export interface NodejsBuildProps {
  /**
   * The AssetProps from which s3-assets are created and copied to the build environment.
   */
  readonly assets: { assetProps: AssetProps; commands?: string[] }[];
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
   * The name of the working directory of build process in the build enironment.
   * @default assetProps[0].path
   */
  readonly workingDirectory?: string;
  /**
   * The path to the directory that contains your build artifacts (relative to the working directory.)
   */
  readonly outputSourceDirectory: string;
}

export class NodejsBuild extends Construct {
  constructor(scope: Construct, id: string, props: NodejsBuildProps) {
    super(scope, id);

    const handler = new NodejsFunction(this, 'CustomResourceHandler', {
      entry: join(__dirname, 'lambda/index.ts'),
      timeout: Duration.minutes(10),
      memorySize: 1792,
      ephemeralStorageSize: Size.gibibytes(5),
      depsLockFilePath: join(__dirname, 'lambda/package-lock.json'),
      bundling: {
        commandHooks: {
          beforeBundling: (i, o) => [`cd ${i} && npm install`],
          afterBundling: (i, o) => [],
          beforeInstall: (i, o) => [],
        },
      },
    });

    let assetHash = '';
    const assets = props.assets.map((a) => {
      const asset = new Asset(this, `Source-${a.assetProps.path.replace('/', '')}`, {
        ...a.assetProps,
      });
      assetHash += asset.assetHash;
      asset.grantRead(handler);
      return asset;
    });

    const md5 = createHash('md5');
    assetHash = md5.update(assetHash).digest('hex');

    const bucket = new Bucket(this, 'Bucket', {
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    bucket.grantWrite(handler);

    const workingDirectory = props.workingDirectory ?? props.assets[0].assetProps.path;

    const properties: ResourceProperties = {
      sources: props.assets.map((s, i) => ({
        sourceBucketName: assets[i].s3BucketName,
        sourceObjectKey: assets[i].s3ObjectKey,
        directoryName: s.assetProps.path,
        commands: props.assets[i].commands,
      })),
      destinationBucketName: bucket.bucketName,
      destinationObjectKey: `${assetHash}.zip`,
      workingDirectory,
      outputSourceDirectory: join(workingDirectory, props.outputSourceDirectory),
      environment: props.buildEnvironment,
      buildCommands: props.buildCommands ?? ['npm run build'],
    };

    const custom = new CustomResource(this, 'CustomResource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKNodejsBuildment',
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
