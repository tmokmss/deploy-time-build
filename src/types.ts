export type ResourceProperties = {
  sources: {
    sourceBucketName: string;
    sourceObjectKey: string;
    extractPath: string;
    commands?: string[];
  }[];
  environment?: { [key: string]: string };
  destinationBucketName: string;
  destinationObjectKey: string;
  workingDirectory: string;
  outputSourceDirectory: string;
  buildCommands: string[];
  codeBuildProjectName: string;
};
