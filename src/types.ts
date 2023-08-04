export type ResourceProperties = NodejsBuildResourceProps | SociIndexBuildResourceProps;

export type NodejsBuildResourceProps = {
  type: 'NodejsBuild';
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

export type SociIndexBuildResourceProps = {
  type: 'SociIndexBuild';
  repositoryName: string;
  imageTag: string;
  codeBuildProjectName: string;
};
