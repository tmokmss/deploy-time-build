import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { MockIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AllowedMethods, Distribution, OriginRequestPolicy, SecurityPolicyProtocol, SSLMethod, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { AwsLogDriver, Cluster, ContainerImage, CpuArchitecture, FargateTaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { ContainerImageBuild, NodejsBuild, SociIndexBuild, SociIndexV2Build } from '../src/';

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

    const distribution = new Distribution(this, "distribution", {
        defaultRootObject: "index.html",
        defaultBehavior: {
            origin: S3BucketOrigin.withOriginAccessControl(dstBucket),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowedMethods: AllowedMethods.ALLOW_ALL,
            originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        },
        minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        sslSupportMethod: SSLMethod.SNI,
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

    const asset = new DockerImageAsset(this, 'Image', { directory: 'example-image', platform: Platform.LINUX_AMD64 });

    new SociIndexBuild(this, 'Index', { imageTag: asset.assetHash, repository: asset.repository });

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
    new FargateTaskDefinition(this, 'TaskDefinition', {}).addContainer('main', {
      image: ContainerImage.fromEcrRepository(asset.repository, asset.assetHash),

      logging: new AwsLogDriver({ streamPrefix: 'main' }),
    });

    const v2 = SociIndexV2Build.fromDockerImageAsset(this, 'IndexV2', asset);

    new FargateTaskDefinition(this, 'TaskDefinitionV2', {}).addContainer('main', {
      image: v2.toEcsDockerImageCode(),
      logging: new AwsLogDriver({ streamPrefix: 'main' }),
    });
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
