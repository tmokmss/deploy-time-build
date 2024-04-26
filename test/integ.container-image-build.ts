import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { Vpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, FargateTaskDefinition, CpuArchitecture, AwsLogDriver } from 'aws-cdk-lib/aws-ecs';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ContainerImageBuild } from '../src';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const image = new ContainerImageBuild(this, 'Build', { directory: '../example/example-image', buildArgs: { DUMMY_FILE_SIZE_MB: '15' } });
    const armImage = new ContainerImageBuild(this, 'BuildArm', {
      directory: '../example/example-image',
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

const stack = new TestStack(app, 'ContainerImageBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});
