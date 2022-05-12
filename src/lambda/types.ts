export type ResourceProperties = {
  sources: {
    sourceBucketName: string;
    sourceObjectKey: string;
    directoryName: string;
  }[];
  environment?: { [key: string]: string };
  destinationBucketName: string;
  destinationObjectKey: string;
  workingDirectory: string;
  outputSourceDirectory: string;
  buildCommands: string[];
};
