import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { NodejsBuild } from '../src/nodejs-build';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const dstBucket = new Bucket(this, 'Destination', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
    });
    const dstPath = '/';

    new NodejsBuild(this, 'ExampleBuild', {
      assets: [
        {
          path: '../example/example-app',
          exclude: ['dist', 'node_modules'],
        },
      ],
      destinationBucket: dstBucket,
      destinationKeyPrefix: dstPath,
      outputSourceDirectory: 'dist',
      buildCommands: ['npm ci', 'npm run build'],
      buildEnvironment: {
        VITE_SOME_TOKEN: dstBucket.bucketName,
      },
      nodejsVersion: 20,
      outputEnvFile: true,
    });
  }
}

const stack = new TestStack(app, 'NodejsBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});
