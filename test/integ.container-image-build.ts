import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import { Stack, StackProps, App } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Cluster, FargateTaskDefinition, CpuArchitecture, AwsLogDriver } from 'aws-cdk-lib/aws-ecs';
import { DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { ContainerImageBuild } from '../src';
import { getCrHandlerHash } from './util';

const app = new App();

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'VpcV2', {
      natGateways: 1,
    });

    const image = new ContainerImageBuild(this, 'Build', { directory: '../example/example-image', buildArgs: { DUMMY_FILE_SIZE_MB: '15' } });
    const armImage = new ContainerImageBuild(this, 'BuildArm', {
      directory: '../example/example-image',
      platform: Platform.LINUX_ARM64,
      repository: image.repository,
      zstdCompression: true,
      buildArgs: {
        HASH: getCrHandlerHash(),
      },
    });
    new DockerImageFunction(this, 'Function', {
      code: image.toLambdaDockerImageCode(),
    });
    new Cluster(this, 'Cluster', {
      vpc,
    });
    new FargateTaskDefinition(this, 'TaskDefinition', { runtimePlatform: { cpuArchitecture: CpuArchitecture.ARM64 } }).addContainer('main', {
      image: armImage.toEcsDockerImageCode(),
      logging: new AwsLogDriver({ streamPrefix: 'main' }),
    });

    const build = new ContainerImageBuild(this, 'BuildVpc', {
      directory: '../example/example-image',
      vpc,
      buildArgs: {
        HASH: getCrHandlerHash(),
      },
    });
    // build must run after NAT gateways are configured
    build.node.addDependency(vpc);
  }
}

const stack = new TestStack(app, 'ContainerImageBuildIntegTest');

new IntegTest(app, 'Test', {
  testCases: [stack],
  diffAssets: true,
});
