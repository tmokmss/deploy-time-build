import { join } from 'path';
import { CustomResource, Duration } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { IRepository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Runtime, RuntimeFamily, SingletonFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { SingletonProject } from './singleton-project';
import { SociIndexBuildResourceProps } from './types';
import { SociIndexV2Build } from './soci-index-v2-build';

export interface SociIndexBuildProps {
  /**
   * The ECR repository your container image is stored.
   * You can only specify a repository in the same environment (account/region).
   * The index artifact will be uploaded to this repository.
   */
  readonly repository: IRepository;

  /**
   * The tag of the container image you want to build index for.
   */
  readonly imageTag: string;
}

/**
 * Build and publish a SOCI index for a container image.
 * A SOCI index helps start Fargate tasks faster in some cases.
 * Please read the following document for more details: https://docs.aws.amazon.com/AmazonECS/latest/userguide/container-considerations.html
 *
 * @deprecated Use {@link SociIndexV2Build} instead. Customers new to SOCI on AWS Fargate can only use SOCI index manifest v2.
 * See [this article](https://aws.amazon.com/blogs/containers/improving-amazon-ecs-deployment-consistency-with-soci-index-manifest-v2/) for more details.
 */
export class SociIndexBuild extends Construct {
  /**
   * A utility method to create a SociIndexBuild construct from a DockerImageAsset instance.
   */
  public static fromDockerImageAsset(scope: Construct, id: string, imageAsset: DockerImageAsset) {
    return new SociIndexBuild(scope, id, {
      repository: imageAsset.repository,
      imageTag: imageAsset.assetHash,
    });
  }

  constructor(scope: Construct, id: string, props: SociIndexBuildProps) {
    super(scope, id);

    const sociWrapperVersion = 'v0.2.8';

    const binaryUrl = `https://github.com/tmokmss/soci-wrapper/releases/download/${sociWrapperVersion}/soci-wrapper-${sociWrapperVersion}-linux-amd64.tar.gz`;

    const handler = new SingletonFunction(this, 'CustomResourceHandler', {
      // Use raw string to avoid from tightening CDK version requirement
      runtime: new Runtime('nodejs22.x', RuntimeFamily.NODEJS),
      code: Code.fromAsset(join(__dirname, '..', 'lambda', 'trigger-codebuild', 'dist')),
      handler: 'index.handler',
      uuid: 'db740fd5-5436-4a84-8a09-e6dfcd01f4f3', // generated for this construct
      lambdaPurpose: 'DeployTimeBuildCustomResourceHandler',
      timeout: Duration.minutes(5),
    });

    const project = new SingletonProject(this, 'Project', {
      uuid: '024cf76a-1003-4aa4-aa4b-12c32c09ca3c', // generated for this construct
      projectPurpose: 'SociIndexBuild',
      environment: { buildImage: LinuxBuildImage.fromCodeBuildImageId('aws/codebuild/standard:7.0') },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'current_dir=$(pwd)',
              `wget --quiet -O soci-wrapper.tar.gz ${binaryUrl}`,
              'tar -xvzf soci-wrapper.tar.gz',
              '',
              'export AWS_ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text)',
              'export REGISTRY_USER=AWS',
              'export REGISTRY_PASSWORD=$(aws ecr get-login-password --region $AWS_REGION)',
              'export REGISTRY=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com',
              'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY',
              'REPO_NAME=$repositoryName',
              'IMAGE_TAG=$imageTag',
              'DIGEST=$(aws ecr describe-images --repository-name $REPO_NAME --image-ids imageTag=$IMAGE_TAG --query imageDetails[0].imageDigest --output text)',
              './soci-wrapper --repo $REPO_NAME --digest $DIGEST --region $AWS_REGION --account $AWS_ACCOUNT',
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
REASON="deploy-time-build failed. See CloudWatch Log stream for the detailed reason: 
https://$AWS_REGION.console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#logsV2:log-groups/log-group/\\$252Faws\\$252Fcodebuild\\$252F$projectName/log-events/$CODEBUILD_LOG_PATH"
fi
cat <<EOF > payload.json
{
  "StackId": "$stackId",
  "RequestId": "$requestId",
  "LogicalResourceId":"$logicalResourceId",
  "PhysicalResourceId": "$imageTag",
  "Status": "$STATUS",
  "Reason": "$REASON"
}
EOF
curl -i -X PUT -H 'Content-Type:' -d "@payload.json" "$responseURL"
              `,
            ],
          },
        },
      }),
    }).project;

    handler.addToRolePolicy(
      new PolicyStatement({
        actions: ['codebuild:StartBuild'],
        resources: [project.projectArn],
      })
    );

    props.repository.grantPullPush(project);
    props.repository.grant(project, 'ecr:DescribeImages');

    const properties: SociIndexBuildResourceProps = {
      type: 'SociIndexBuild',
      imageTag: props.imageTag,
      repositoryName: props.repository.repositoryName,
      codeBuildProjectName: project.projectName,
    };

    new CustomResource(this, 'Resource', {
      serviceToken: handler.functionArn,
      resourceType: 'Custom::CDKSociIndexBuild',
      properties,
    });
  }
}
