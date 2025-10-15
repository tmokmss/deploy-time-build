"use strict";
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_codebuild = require("@aws-sdk/client-codebuild");
var import_crypto = __toESM(require("crypto"));
var import_promises = require("timers/promises");
var cb = new import_client_codebuild.CodeBuildClient({});
var handler = async (event, context) => {
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
                value: JSON.stringify(
                  props.sources.map((source) => ({
                    assetUrl: `s3://${source.sourceBucketName}/${source.sourceObjectKey}`,
                    extractPath: source.extractPath,
                    commands: (source.commands ?? []).join(" && ")
                  }))
                )
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
                name: "destinationKeyPrefix",
                // remove the beginning / if any
                value: props.destinationKeyPrefix.startsWith("/") ? props.destinationKeyPrefix.slice(1) : props.destinationKeyPrefix
              },
              {
                name: "distributionId",
                value: props.distributionId ?? ""
              },
              {
                name: "distributionPath",
                value: (() => {
                  let path = props.destinationKeyPrefix;
                  if (!path.startsWith("/")) {
                    path = "/" + path;
                  }
                  if (!path.endsWith("/")) {
                    path += "/";
                  }
                  return path + "*";
                })()
              },
              {
                name: "assetBucketName",
                value: props.assetBucketName
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
        case "SociIndexV2Build":
          command = new import_client_codebuild.StartBuildCommand({
            projectName: props.codeBuildProjectName,
            environmentVariablesOverride: [
              ...commonEnvironments,
              {
                name: "repositoryName",
                value: props.repositoryName
              },
              {
                name: "inputImageTag",
                value: props.inputImageTag
              },
              {
                name: "outputImageTag",
                value: props.outputImageTag
              },
              {
                name: "projectName",
                value: props.codeBuildProjectName
              }
            ]
          });
          break;
        case "ContainerImageBuild": {
          const imageTag = props.imageTag ?? `${props.tagPrefix ?? ""}${newPhysicalId}`;
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
                name: "repositoryRegion",
                value: props.repositoryUri.split(".")[3]
              },
              {
                name: "buildCommand",
                value: props.buildCommand
              },
              {
                name: "imageTag",
                value: imageTag
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
      let retries = 0;
      while (retries < 10) {
        try {
          await cb.send(command);
          break;
        } catch (error) {
          if (error.name === "AccessDeniedException") {
            retries++;
            console.log(`AccessDeniedException encountered, retrying (${retries})...`);
            await (0, import_promises.setTimeout)(5e3);
          } else {
            throw error;
          }
        }
      }
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
  const responseBody = {
    Status: status,
    Reason: reason ?? "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: {}
    //responseData
  };
  const responseBodyString = JSON.stringify(responseBody);
  await fetch(event.ResponseURL, {
    method: "PUT",
    body: responseBodyString,
    headers: {
      "Content-Type": "",
      "Content-Length": responseBodyString.length.toString()
    }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
