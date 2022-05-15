const { awscdk } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  cdkVersion: '2.20.0',
  defaultReleaseBranch: 'main',
  name: 'deploy-time-build',
  repositoryUrl: 'https://github.com/tmokmss/deploy-time-build.git',
  eslintOptions: {
    ignorePatterns: ['example/**/*', "lambda/**/*"],
  },
  keywords: ['aws', 'cdk', 'lambda', 'aws-cdk'],
  tsconfig: {
  },
  description: 'Build your frontend apps during CDK deployment!',
});
// Bundle custom resource handler Lambda code
project.projectBuild.compileTask.prependExec('npm ci && npm run build', {cwd: 'lambda/nodejs-build'});
project.synth();
