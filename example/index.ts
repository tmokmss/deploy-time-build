import { Stack, StackProps, App, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MockIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { ContainerImageBuild, NodejsBuild, SociIndexBuild } from '../src/';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { AwsLogDriver, Cluster, CpuArchitecture, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { OriginAccessIdentity, CloudFrontWebDistribution } from 'aws-cdk-lib/aws-cloudfront';

class NodejsTestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const api = new RestApi(this, 'ExampleApi');
    api.root.addMethod(
      'ANY',
      new MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );

    const dstBucket = new Bucket(this, 'DstBucket', {
      // autoDeleteObjects: true,
      // removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
    });
    const dstPath = '/';

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');

    const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: dstBucket,
            originAccessIdentity,
            // originPath: dstPath,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
    });

    new CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });

    new NodejsBuild(this, 'ExampleBuild', {
      assets: [
        {
          path: 'example-app',
          exclude: ['dist', 'node_modules'],
        },
      ],
      destinationBucket: dstBucket,
      destinationKeyPrefix: dstPath,
      outputSourceDirectory: 'dist',
      distribution,
      buildCommands: ['npm ci', 'npm run build'],
      buildEnvironment: {
        VITE_API_ENDPOINT: api.url,
        AAA: 'asdf',
        BBB: dstBucket.bucketName,
      },
      nodejsVersion: 20,
      outputEnvFile: true,
    });

  }
}

class SociIndexTestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const asset = new DockerImageAsset(this, 'Image', { directory: 'example-image' });

    new SociIndexBuild(this, 'Index', { imageTag: asset.assetHash, repository: asset.repository });
  }
}

class ContainerImageTestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const image = new ContainerImageBuild(this, 'Build', { directory: 'example-image', buildArgs: { DUMMY_FILE_SIZE_MB: '15' } });
    const armImage = new ContainerImageBuild(this, 'BuildArm', {
      directory: 'example-image',
      platform: Platform.LINUX_ARM64,
      repository: image.repository,
      zstdCompression: true,
    });
    new DockerImageFunction(this, 'Function', {
      code: image.toLambdaDockerImageCode(),
    });
    new Cluster(this, 'Cluster', {
      vpc: new Vpc(this, 'Vpc', {
        maxAzs: 1,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'public',
            subnetType: SubnetType.PUBLIC,
          },
        ],
      }),
    });
    new FargateTaskDefinition(this, 'TaskDefinition', { runtimePlatform: { cpuArchitecture: CpuArchitecture.ARM64 } }).addContainer('main', {
      image: armImage.toEcsDockerImageCode(),
      logging: new AwsLogDriver({ streamPrefix: 'main' }),
    });
  }
}

class TestApp extends App {
  constructor() {
    super();

    new NodejsTestStack(this, 'NodejsTestStack');
    new SociIndexTestStack(this, 'SociIndexTestStack');
    new ContainerImageTestStack(this, 'ContainerImageTestStack');
  }
}

new TestApp().synth();
