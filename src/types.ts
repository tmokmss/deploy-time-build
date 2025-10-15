export type ResourceProperties =
  | NodejsBuildResourceProps
  | SociIndexBuildResourceProps
  | SociIndexV2BuildResourceProps
  | ContainerImageBuildResourceProps;

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
  destinationKeyPrefix: string;
  distributionId?: string;
  assetBucketName: string;
  workingDirectory: string;
  outputSourceDirectory: string;
  buildCommands: string[];
  codeBuildProjectName: string;
  outputEnvFile: boolean;
};

export type SociIndexBuildResourceProps = {
  type: 'SociIndexBuild';
  repositoryName: string;
  imageTag: string;
  codeBuildProjectName: string;
};

export type SociIndexV2BuildResourceProps = {
  type: 'SociIndexV2Build';
  repositoryName: string;
  inputImageTag: string;
  outputImageTag: string;
  codeBuildProjectName: string;
};

export type ContainerImageBuildResourceProps = {
  type: 'ContainerImageBuild';
  buildCommand: string;
  repositoryUri: string;
  imageTag?: string;
  tagPrefix?: string;
  codeBuildProjectName: string;
  sourceS3Url: string;
};
