import { CodeBuildClient, StartBuildCommand } from '@aws-sdk/client-codebuild';
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
  let rootDir = '';
  console.log(JSON.stringify(event));

  try {
    if (event.RequestType == 'Create' || event.RequestType == 'Update') {
      const props = event.ResourceProperties;

      // start code build project
      await cb.send(
        new StartBuildCommand({
          projectName: props.codeBuildProjectName,
          environmentVariablesOverride: [
            {
              name: 'input',
              value: JSON.stringify(props.sources.map(source=> ({
                assetUrl: `s3://${source.sourceBucketName}/${source.sourceObjectKey}`,
                extractPath: source.directoryName,
                commands: (source.commands ?? []).join(" && "),
              }))),
            },
            {
              name: 'buildCommands',
              value: props.buildCommands.join(" && "),
            },
            {
              name: 'destinationBucketName',
              value: props.destinationBucketName,
            },
            {
              name: 'destinationObjectKey',
              value: props.destinationObjectKey
            },
            {
              name: 'workingDirectory',
              value: props.workingDirectory
            },
            {
              name: 'outputSourceDirectory',
              value: props.outputSourceDirectory
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
        })
      );
    } else {
      // how do we process 'Delete' event?
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
