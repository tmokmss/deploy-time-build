import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';
import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse, Context } from 'aws-lambda';
import Crypto from 'crypto';
import { setTimeout } from 'timers/promises';
import type { ResourceProperties } from '../../src/types';

const cb = new CodeBuildClient({});

type Event = CloudFormationCustomResourceEvent & {
  ResourceProperties: ResourceProperties;
};

export const handler = async (event: Event, context: Context) => {
  try {
    if (event.RequestType == 'Create' || event.RequestType == 'Update') {
      const props = event.ResourceProperties;
      const commonEnvironments = [
        {
          name: 'responseURL',
          value: event.ResponseURL,
        },
        {
          name: 'stackId',
          value: event.StackId,
        },
        {
          name: 'requestId',
          value: event.RequestId,
        },
        {
          name: 'logicalResourceId',
          value: event.LogicalResourceId,
        },
      ];
      const newPhysicalId = Crypto.randomBytes(16).toString('hex');

      let command: StartBuildCommand;
      switch (props.type) {
        case 'NodejsBuild':
          command = new StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: 'input',
                value: JSON.stringify(
                  props.sources.map((source) => ({
                    assetUrl: `s3://${source.sourceBucketName}/${source.sourceObjectKey}`,
                    extractPath: source.extractPath,
                    commands: (source.commands ?? []).join(' && '),
                  }))
                ),
              },
              {
                name: 'buildCommands',
                value: props.buildCommands.join(' && '),
              },
              {
                name: 'destinationBucketName',
                value: props.destinationBucketName,
              },
              {
                name: 'destinationKeyPrefix',
                // remove the beginning / if any
                value: props.destinationKeyPrefix.startsWith('/') ? props.destinationKeyPrefix.slice(1) : props.destinationKeyPrefix,
              },
              {
                name: 'distributionId',
                value: props.distributionId ?? '',
              },
              {
                name: 'distributionPath',
                value: (() => {
                  let path = props.destinationKeyPrefix;
                  if (!path.startsWith('/')) {
                    path = '/' + path;
                  }
                  if (!path.endsWith('/')) {
                    path += '/';
                  }
                  return path + '*';
                })(),
              },
              {
                name: 'assetBucketName',
                value: props.assetBucketName,
              },
              {
                name: 'workingDirectory',
                value: props.workingDirectory,
              },
              {
                name: 'outputSourceDirectory',
                value: props.outputSourceDirectory,
              },
              {
                name: 'projectName',
                value: props.codeBuildProjectName,
              },
              {
                name: 'outputEnvFile',
                value: props.outputEnvFile.toString(),
              },
              {
                name: 'envFileKey',
                value: `deploy-time-build/${event.StackId.split('/')[1]}/${event.LogicalResourceId}/${newPhysicalId}.env`,
              },
              {
                name: 'envNames',
                value: Object.keys(props.environment ?? {}).join(','),
              },
              ...Object.entries(props.environment ?? {}).map(([name, value]) => ({
                name,
                value,
              })),
            ],
          });
          break;
        case 'SociIndexBuild':
          command = new StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: 'repositoryName',
                value: props.repositoryName,
              },
              {
                name: 'imageTag',
                value: props.imageTag,
              },
              {
                name: 'projectName',
                value: props.codeBuildProjectName,
              },
            ],
          });
          break;
        case 'SociIndexV2Build':
          command = new StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: 'repositoryName',
                value: props.repositoryName,
              },
              {
                name: 'inputImageTag',
                value: props.inputImageTag,
              },
              {
                name: 'outputImageTag',
                value: props.outputImageTag,
              },
              {
                name: 'projectName',
                value: props.codeBuildProjectName,
              },
            ],
          });
          break;
        case 'ContainerImageBuild': {
          const imageTag = props.imageTag ?? `${props.tagPrefix ?? ''}${newPhysicalId}`;
          command = new StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: 'repositoryUri',
                value: props.repositoryUri,
              },
              {
                name: 'repositoryAuthUri',
                value: props.repositoryUri.split('/')[0],
              },
              {
                name: 'repositoryRegion',
                value: props.repositoryUri.split('.')[3],
              },
              {
                name: 'buildCommand',
                value: props.buildCommand,
              },
              {
                name: 'imageTag',
                value: imageTag,
              },
              {
                name: 'projectName',
                value: props.codeBuildProjectName,
              },
              {
                name: 'sourceS3Url',
                value: props.sourceS3Url,
              },
            ],
          });
          break;
        }
        default:
          throw new Error(`invalid event type ${props}}`);
      }
      // start code build project
      let retries = 0;
      while (retries < 10) {
        try {
          await cb.send(command);
          break;
        } catch (error: any) {
          // Sometimes AccessDeniedException is thrown due to IAM propagation delay. It should be resolved with retry.
          if (error.name === 'AccessDeniedException') {
            retries++;
            console.log(`AccessDeniedException encountered, retrying (${retries})...`);
            await setTimeout(5000);
          } else {
            throw error;
          }
        }
      }

      // Sometimes CodeBuild build fails before running buildspec, without calling the CFn callback.
      // We can poll the status of a build for a few minutes and sendStatus if such errors are detected.
      // if (build.build?.id == null) {
      //   throw new Error('build id is null');
      // }

      // for (let i=0; i< 20; i++) {
      //   const res = await cb.send(new BatchGetBuildsCommand({ ids: [build.build.id] }));
      //   const status = res.builds?.[0].buildStatus;
      //   if (status == null) {
      //     throw new Error('build status is null');
      //   }

      //   await new Promise((resolve) => setTimeout(resolve, 5000));
      // }
    } else {
      // Do nothing on a DELETE event.
      await sendStatus('SUCCESS', event, context);
    }
  } catch (e) {
    console.log(e);
    const err = e as Error;
    await sendStatus('FAILED', event, context, err.message);
  }
};

const sendStatus = async (status: 'SUCCESS' | 'FAILED', event: Event, context: Context, reason?: string) => {
  const responseBody: CloudFormationCustomResourceResponse = {
    Status: status,
    Reason: reason ?? 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: {}, //responseData
  };
  const responseBodyString = JSON.stringify(responseBody);

  await fetch(event.ResponseURL, {
    method: 'PUT',
    body: responseBodyString,
    headers: {
      'Content-Type': '',
      'Content-Length': responseBodyString.length.toString(),
    },
  });
};
