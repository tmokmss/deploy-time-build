import { BatchGetBuildsCommand, CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';
import type { ResourceProperties } from '../../src/types';

const cb = new CodeBuildClient({});

type Event = {
  RequestType: 'Create' | 'Update' | 'Delete';
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  ResourceProperties: ResourceProperties;
};

export const handler = async (event: Event, context: any) => {
  console.log(JSON.stringify(event));

  try {
    if (event.RequestType == 'Create' || event.RequestType == 'Update') {
      const props = event.ResourceProperties;

      let command: StartBuildCommand;
      switch (props.type) {
        case 'NodejsBuild':
          command = new StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
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
                name: 'destinationObjectKey',
                value: props.destinationObjectKey,
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
            ],
          });
          break;
        default:
          throw new Error(`invalid event type ${props}}`);
      }
      // start code build project
      const build = await cb.send(command);

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

const sendStatus = async (status: 'SUCCESS' | 'FAILED', event: Event, context: any, reason?: string) => {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: reason ?? 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: {}, //responseData
  });

  await fetch(event.ResponseURL, {
    method: 'PUT',
    body: responseBody,
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length.toString(),
    },
  });
};
