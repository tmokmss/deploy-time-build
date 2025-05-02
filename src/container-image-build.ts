import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { CfnResource, CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { BuildSpec, ComputeType, LinuxArmBuildImage, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { IRepository, Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAssetProps } from 'aws-cdk-lib/aws-ecr-assets';
import { ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { IGrantable, IPrincipal, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, DockerImageCode, Runtime, RuntimeFamily, SingletonFunction } from 'aws-cdk-lib/aws-lambda';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { SingletonProject } from './singleton-project';
import { ContainerImageBuildResourceProps } from './types';

export interface ContainerImageBuildProps extends DockerImageAssetProps {
  /**
   * The tag when to push the image
   * @default use assetHash as tag
   */
  readonly tag?: string;

  /**
   * Prefix to add to the image tag
   * @default no prefix
   */
  readonly tagPrefix?: string;

  /**
   * The ECR repository to push the image.
   * @default create a new ECR repository
   */
  readonly repository?: IRepository;

  /**
   * Use zstd for compressing a container image.
   * @default false
   */
  readonly zstdCompression?: boolean;

  /**
   * The VPC where your build job will be deployed.
   * This VPC must have private subnets with NAT Gateways.
   *
   * Use this property when you want to control the outbound IP addresses that base images are pulled from.
   * @default No VPC used.
   */
  readonly vpc?: IVpc;
}

/**
 * Build a container image and push it to an ECR repository on deploy-time.
 */
export class ContainerImageBuild extends Construct implements IGrantable {
  public readonly grantPrincipal: IPrincipal;
  public readonly repository: IRepository;
  public readonly imageTag: string;

  constructor(scope: Construct, id: string, private readonly props: ContainerImageBuildProps) {
    super(scope, id);

    const handler = new SingletonFunction(this, 'CustomResourceHandler', {
      // Use raw string to avoid from tightening CDK version requirement
      runtime: new Runtime('nodejs20.x', RuntimeFamily.NODEJS),
      code: Code.fromAsset(join(__dirname, '../lambda/trigger-codebuild/dist')),
      handler: 'index.handler',
      uuid: 'db740fd5-5436-4a84-8a09-e6dfcd01f4f3', // generated for this construct
      lambdaPurpose: 'DeployTimeBuildCustomResourceHandler',
      timeout: Duration.minutes(5),
    });

    // Use buildx for cross-platform image build
    const armImage = LinuxArmBuildImage.fromCodeBuildImageId('aws/codebuild/amazonlinux2-aarch64-standard:3.0');
    const x64Image = LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:7.0');
    // Select the build image based on the target platform
    const isArm64 = props.platform?.platform === 'linux/arm64';
    const buildImage = isArm64 ? armImage : x64Image;

    let repository = props.repository;
    if (repository === undefined) {
      repository = new Repository(this, 'Repository', { removalPolicy: RemovalPolicy.DESTROY });
      (repository.node.defaultChild as CfnResource).addPropertyOverride('EmptyOnDelete', true);
    }

    const project = new SingletonProject(this, 'Project', {
      uuid: 'e83729fe-b156-4e70-9bec-452b15847a30',
      projectPurpose: isArm64 ? 'ContainerImageBuildArm64' : 'ContainerImageBuildAmd64',
      environment: {
        computeType: ComputeType.SMALL,
        buildImage: buildImage,
        privileged: true,
      },
      vpc: props.vpc,
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'current_dir=$(pwd)',
              'echo "$input"',
              'mkdir workdir',
              'cd workdir',
              'aws s3 cp "$sourceS3Url" temp.zip',
              'unzip temp.zip',
              'ls -la',
              'aws ecr get-login-password | docker login --username AWS --password-stdin $repositoryAuthUri',
              'aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws',
              'docker buildx create --use',
              'docker buildx ls',
              'eval "$buildCommand"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              `
STATUS='SUCCESS'
if [ $CODEBUILD_BUILD_SUCCEEDING -ne 1 ] # Test if the build is failing
then
STATUS='FAILED'
REASON="ContainerImageBuild failed. See CloudWatch Log stream for the detailed reason: 
https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\\$252Faws\\$252Fcodebuild\\$252F$projectName/log-events/$CODEBUILD_LOG_PATH"
fi
cat <<EOF > payload.json
{
  "StackId": "$stackId",
  "RequestId": "$requestId",
  "LogicalResourceId":"$logicalResourceId",
  "PhysicalResourceId": "$imageTag",
  "Status": "$STATUS",
  "Reason": "$REASON",
  "Data": {
    "ImageTag": "$imageTag"
  }
}
EOF
curl -v -i -X PUT -H 'Content-Type:' -d "@payload.json" "$responseURL"
              `,
            ],
          },
        },
      }),
    }).project;

    project.role!.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonElasticContainerRegistryPublicReadOnly'));
    repository.grantPullPush(project);
    repository.grant(project, 'ecr:DescribeImages');

    handler.addToRolePolicy(
      new PolicyStatement({
        actions: ['codebuild:StartBuild'],
        resources: [project.projectArn],
      }),
    );

    this.grantPrincipal = project.grantPrincipal;

    let assetExclude = props.exclude;
    // automatically read .dockerignore for convenience
    if (assetExclude === undefined && existsSync(join(props.directory, '.dockerignore'))) {
      assetExclude = readFileSync(join(props.directory, '.dockerignore')).toString().split('\n');
    }
    const asset = new Asset(this, 'Source', {
      ...props,
      exclude: assetExclude,
      path: props.directory,
    });
    asset.grantRead(project);

    const imageTag = `${props.tagPrefix ?? ''}${props.tag ?? this.getImageHash(asset.assetHash, props)}`;
    const buildCommandOptions = { ...props, tag: imageTag, platform: props.platform?.platform } as any;
    buildCommandOptions.outputs ??= [];
    // to enable zstd compression, buildx directly pushes the artifact image to a registry
    // https://aws.amazon.com/blogs/containers/reducing-aws-fargate-startup-times-with-zstd-compressed-container-images/
    buildCommandOptions.outputs.push('type=image', `name=${repository.repositoryUri}:${imageTag}`, 'push=true');
    if (props.zstdCompression) {
      buildCommandOptions.outputs.push('oci-mediatypes=true', 'compression=zstd', 'force-compression=true', 'compression-level=3');
    }
    const buildCommand = this.getDockerBuildCommand(buildCommandOptions);

    const properties: ContainerImageBuildResourceProps = {
      type: 'ContainerImageBuild',
      buildCommand: buildCommand,
      repositoryUri: repository.repositoryUri,
      imageTag,
      codeBuildProjectName: project.projectName,
      sourceS3Url: asset.s3ObjectUrl,
    };

    const custom = new CustomResource(this, 'Resource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKContainerImageBuild',
      properties,
    });

    this.repository = repository;
    this.imageTag = custom.getAttString('ImageTag');
  }

  /**
   * Get the instance of {@link DockerImageCode} for a Lambda function image.
   */
  public toLambdaDockerImageCode() {
    if (this.props.zstdCompression) {
      throw new Error('You cannot enable zstdCompression for a Lambda image.');
    }
    return DockerImageCode.fromEcr(this.repository, { tagOrDigest: this.imageTag });
  }

  /**
   * Get the instance of {@link ContainerImage} for an ECS task definition.
   */
  public toEcsDockerImageCode() {
    return ContainerImage.fromEcrRepository(this.repository, this.imageTag);
  }

  private getImageHash(assetHash: string, props: any) {
    const extraHash: { [field: string]: any } = {};
    if (props.invalidation?.extraHash !== false && props.extraHash) {
      extraHash.user = props.extraHash;
    }
    // buildArgs often contains tokens, so must be omitted from here.
    // custom resource properties contain buildArgs, so the build runs anyway.
    // if (props.invalidation?.buildArgs !== false && props.buildArgs) {
    //   extraHash.buildArgs = props.buildArgs;
    // }
    if (props.invalidation?.buildSecrets !== false && props.buildSecrets) {
      extraHash.buildSecrets = props.buildSecrets;
    }
    if (props.invalidation?.buildSsh !== false && props.buildSsh) {
      extraHash.buildSsh = props.buildSsh;
    }
    if (props.invalidation?.target !== false && props.target) {
      extraHash.target = props.target;
    }
    if (props.invalidation?.file !== false && props.file) {
      extraHash.file = props.file;
    }
    if (props.invalidation?.repositoryName !== false && props.repositoryName) {
      extraHash.repositoryName = props.repositoryName;
    }
    if (props.invalidation?.networkMode !== false && props.networkMode) {
      extraHash.networkMode = props.networkMode;
    }
    if (props.invalidation?.platform !== false && props.platform) {
      extraHash.platform = props.platform.platform;
    }
    if (props.invalidation?.outputs !== false && props.outputs) {
      extraHash.outputs = props.outputs;
    }
    if (props.zstdCompression) {
      extraHash.zstdCompression = props.zstdCompression;
    }
    return createHash('md5')
      .update(assetHash + JSON.stringify(extraHash))
      .digest('hex');
  }

  private getDockerBuildCommand(options: any) {
    // the members of props differs with CDK version.
    // By regarding props as any, we can use props that are not available in older cdk versions.

    // logic is copied from packages/cdk-assets/lib/private/docker.ts
    const cacheOptionToFlag = (option: any): string => {
      let flag = `type=${option.type}`;
      if (option.params) {
        flag +=
          ',' +
          Object.entries(option.params)
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
      }
      return flag;
    };
    const flatten = (x: string[][]) => {
      return Array.prototype.concat([], ...x);
    };

    const dockerBuildCommand = [
      'docker buildx build',
      ...flatten(Object.entries(options.buildArgs || {}).map(([k, v]) => ['--build-arg', `${k}=${v}`])),
      ...flatten(Object.entries(options.buildSecrets || {}).map(([k, v]) => ['--secret', `id=${k},${v}`])),
      ...(options.buildSsh ? ['--ssh', options.buildSsh] : []),
      ...(options.target ? ['--target', options.target] : []),
      ...(options.file ? ['--file', options.file] : []),
      ...(options.networkMode ? ['--network', options.networkMode] : []),
      ...(options.platform ? ['--platform', options.platform] : []),
      ...(options.outputs ? ['--output', options.outputs.join(',')] : []),
      ...(options.cacheFrom ? [...options.cacheFrom.map((cacheFrom: any) => ['--cache-from', cacheOptionToFlag(cacheFrom)]).flat()] : []),
      ...(options.cacheTo ? ['--cache-to', cacheOptionToFlag(options.cacheTo)] : []),
      ...(options.cacheDisabled ? ['--no-cache'] : []),
      '--provenance=false',
      '.',
    ];
    return dockerBuildCommand.join(' ');
  }
}
