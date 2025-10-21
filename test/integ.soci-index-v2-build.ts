import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { SociIndexV2Build } from '../src';
import { getCrHandlerHash } from './util';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // make sure we can build more than one indices.
    {
      const parent = new Construct(this, 'Image1');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: '../example/example-image',
        buildArgs: { DUMMY_FILE_SIZE_MB: '11', HASH: getCrHandlerHash() },
      });
      new SociIndexV2Build(parent, 'Index', {
        inputImageTag: asset.assetHash,
        outputImageTag: `${asset.assetHash}-soci`,
        repository: asset.repository,
      });
    }

    {
      const parent = new Construct(this, 'Image2');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: '../example/example-image',
        buildArgs: { DUMMY_FILE_SIZE_MB: '50' },
      });
      SociIndexV2Build.fromDockerImageAsset(parent, 'Index', asset);
    }
  }
}

const stack = new TestStack(app, 'SociIndexBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});
