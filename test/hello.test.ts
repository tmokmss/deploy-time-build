import { Stack, App, Aspects } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { AwsSolutionsChecks } from 'cdk-nag';
import { NodejsBuild } from '../src/nodejs-build';
import { Annotations, Match } from 'aws-cdk-lib/assertions';

test('pass cdk-nag', () => {
  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'Stack');

  const dstBucket = new Bucket(stack, 'Destination', {
    enforceSSL: true,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    encryption: BucketEncryption.S3_MANAGED,
  });

  new NodejsBuild(stack, 'ExampleBuild', {
    assets: [
      {
        path: './example/example-app',
        exclude: ['dist', 'node_modules'],
      },
    ],
    destinationBucket: dstBucket,
    destinationKeyPrefix: '/',
    outputSourceDirectory: 'dist',
    buildCommands: ['npm ci', 'npm run build'],
    buildEnvironment: {
      VITE_SOME_TOKEN: dstBucket.bucketName,
    },
  });

  // WHEN
  Aspects.of(app).add(new AwsSolutionsChecks());

  // THEN
  const errors = Annotations.fromStack(stack).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'))
  .filter(entry=>entry.);
  const errors2 = Annotations.fromStack(stack).findError('/Stack/NodejsBuildCustomResourceHandler25648b212c404f09aa65b6bbb0c44659/', Match.stringLikeRegexp('AwsSolutions-.*'));
  expect(errors).toBe({});
  expect(errors2).toBe({});
});
