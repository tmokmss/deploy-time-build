const { awscdk } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  cdkVersion: '2.38.0',  // For using @aws-cdk/integ-runner
  defaultReleaseBranch: 'main',
  name: 'deploy-time-build',
  license: 'MIT',
  repositoryUrl: 'https://github.com/tmokmss/deploy-time-build.git',
  eslintOptions: {
    ignorePatterns: ['example/**/*', 'lambda/**/*', 'test/assets/**/*', 'test/*.snapshot/**/*', '*.d.ts'],
  },
  gitignore: [
    '*.js', '*.d.ts', '!test/*.integ.snapshot/**/*'
  ],
  keywords: ['aws', 'cdk', 'lambda', 'aws-cdk'],
  tsconfigDev: {
    exclude: ['example', 'test/*.integ.snapshot']
  },
  devDeps: ['@aws-cdk/integ-runner@2.38.0', '@aws-cdk/integ-tests-alpha@2.38.0-alpha.0'],
  description: 'Build your frontend apps during CDK deployment!',
});
// Bundle custom resource handler Lambda code
project.projectBuild.compileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
// Run integ-test
project.projectBuild.testTask.exec('yarn tsc -p tsconfig.dev.json && yarn integ-runner');
project.synth();
