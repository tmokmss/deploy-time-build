var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var trigger_codebuild_exports = {};
__export(trigger_codebuild_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(trigger_codebuild_exports);
var import_client_codebuild = require("@aws-sdk/client-codebuild");
var import_crypto = __toESM(require("crypto"));
var cb = new import_client_codebuild.CodeBuildClient({});
var handler = async (event, context) => {
  console.log(JSON.stringify(event));
  try {
    if (event.RequestType == "Create" || event.RequestType == "Update") {
      const props = event.ResourceProperties;
      const commonEnvironments = [
        {
          name: "responseURL",
          value: event.ResponseURL
        },
        {
          name: "stackId",
          value: event.StackId
        },
        {
          name: "requestId",
          value: event.RequestId
        },
        {
          name: "logicalResourceId",
          value: event.LogicalResourceId
        }
      ];
      const newPhysicalId = import_crypto.default.randomBytes(16).toString("hex");
      let command;
      switch (props.type) {
        case "NodejsBuild":
          command = new import_client_codebuild.StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: "input",
                value: JSON.stringify(props.sources.map((source) => ({
                  assetUrl: `s3://${source.sourceBucketName}/${source.sourceObjectKey}`,
                  extractPath: source.extractPath,
                  commands: (source.commands ?? []).join(" && ")
                })))
              },
              {
                name: "buildCommands",
                value: props.buildCommands.join(" && ")
              },
              {
                name: "destinationBucketName",
                value: props.destinationBucketName
              },
              {
                name: "destinationObjectKey",
                value: `${newPhysicalId}.zip`
              },
              {
                name: "workingDirectory",
                value: props.workingDirectory
              },
              {
                name: "outputSourceDirectory",
                value: props.outputSourceDirectory
              },
              {
                name: "projectName",
                value: props.codeBuildProjectName
              },
              {
                name: "outputEnvFile",
                value: props.outputEnvFile.toString()
              },
              {
                name: "envFileKey",
                value: `deploy-time-build/${event.StackId.split("/")[1]}/${event.LogicalResourceId}/${newPhysicalId}.env`
              },
              {
                name: "envNames",
                value: Object.keys(props.environment ?? {}).join(",")
              },
              ...Object.entries(props.environment ?? {}).map(([name, value]) => ({
                name,
                value
              }))
            ]
          });
          break;
        case "SociIndexBuild":
          command = new import_client_codebuild.StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: "repositoryName",
                value: props.repositoryName
              },
              {
                name: "imageTag",
                value: props.imageTag
              },
              {
                name: "projectName",
                value: props.codeBuildProjectName
              }
            ]
          });
          break;
        case "ContainerImageBuild": {
          command = new import_client_codebuild.StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: "repositoryUri",
                value: props.repositoryUri
              },
              {
                name: "repositoryAuthUri",
                value: props.repositoryUri.split("/")[0]
              },
              {
                name: "buildCommand",
                value: props.buildCommand
              },
              {
                name: "imageTag",
                value: props.imageTag
              },
              {
                name: "projectName",
                value: props.codeBuildProjectName
              },
              {
                name: "sourceS3Url",
                value: props.sourceS3Url
              }
            ]
          });
          break;
        }
        default:
          throw new Error(`invalid event type ${props}}`);
      }
      const build = await cb.send(command);
    } else {
      await sendStatus("SUCCESS", event, context);
    }
  } catch (e) {
    console.log(e);
    const err = e;
    await sendStatus("FAILED", event, context, err.message);
  }
};
var sendStatus = async (status, event, context, reason) => {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: reason ?? "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: {}
  });
  await fetch(event.ResponseURL, {
    method: "PUT",
    body: responseBody,
    headers: {
      "Content-Type": "",
      "Content-Length": responseBody.length.toString()
    }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
