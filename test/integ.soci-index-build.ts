import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Construct } from 'constructs';
import { SociIndexBuild } from '../src';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // make sure we can build more than one indices.
    {
      const parent = new Construct(this, 'Image1');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: '../example/example-image',
        buildArgs: { DUMMY_FILE_SIZE_MB: '11' },
      });
      new SociIndexBuild(parent, 'Index', { imageTag: asset.assetHash, repository: asset.repository });
    }

    {
      const parent = new Construct(this, 'Image2');
      const asset = new DockerImageAsset(parent, 'Image', {
        directory: '../example/example-image',
        buildArgs: { DUMMY_FILE_SIZE_MB: '50' },
      });
      SociIndexBuild.fromDockerImageAsset(parent, 'Index', asset);
    }
  }
}

const stack = new TestStack(app, 'SociIndexBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});
