import { Stack, StackProps, App, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MockIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { NodejsBuild } from '../src/nodejs-build';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { OriginAccessIdentity, CloudFrontWebDistribution } from 'aws-cdk-lib/aws-cloudfront';

class TestStack extends Stack {
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
          assetProps: {
            path: 'example-app',
            exclude: ['dist', 'node_modules'],
          },
          commands: ['npm install'],
        },
      ],
      destinationBucket: dstBucket,
      destinationKeyPrefix: dstPath,
      outputSourceDirectory: 'dist',
      distribution,
      buildEnvironment: {
        VITE_API_ENDPOINT: api.url,
      },
    });

    new CfnOutput(this, 'DomainName', {
      value: distribution.distributionDomainName,
    });
  }
}

class TestApp extends App {
  constructor() {
    super();

    new TestStack(this, 'TestStack');
  }
}

new TestApp().synth();
