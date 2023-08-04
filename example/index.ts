import { Stack, StackProps, App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MockIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsBuild, SociIndexBuild } from '../src/';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity, CloudFrontWebDistribution } from 'aws-cdk-lib/aws-cloudfront';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

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
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
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
      },
      nodejsVersion: 18,
    });

    new CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
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

class TestApp extends App {
  constructor() {
    super();

    new NodejsTestStack(this, 'NodejsTestStack');
    new SociIndexTestStack(this, 'SociIndexTestStack');
  }
}

new TestApp().synth();
