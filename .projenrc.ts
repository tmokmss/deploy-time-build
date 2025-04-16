import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkConstructLibrary({
  projenrcTs: true,
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  cdkVersion: '2.38.0', // For using @aws-cdk/integ-runner
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.8.0',
  name: 'deploy-time-build',
  license: 'MIT',
  repositoryUrl: 'https://github.com/tmokmss/deploy-time-build.git',
  publishToPypi: {
    distName: 'deploy-time-build',
    module: 'deploy_time_build',
  },
  packageManager: NodePackageManager.NPM,
  eslintOptions: {
    dirs: [],
    ignorePatterns: ['example/**/*', 'lambda/**/*', 'test/assets/**/*', 'test/*.snapshot/**/*', '*.d.ts'],
  },
  gitignore: ['*.js', '*.d.ts', '!test/*.integ.snapshot/**/*'],
  keywords: ['aws', 'cdk', 'lambda', 'aws-cdk', 'ecr', 'ecs'],
  tsconfigDev: {
    compilerOptions: {},
    exclude: ['example', 'test/*.integ.snapshot'],
  },
  devDeps: ['@aws-cdk/integ-runner@2.38.0', '@aws-cdk/integ-tests-alpha@2.38.0-alpha.0'],
  description: 'Build during CDK deployment.',
});
// Bundle custom resource handler Lambda code
project.projectBuild.compileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
// Run integ-test
project.projectBuild.testTask.exec('npx tsc -p tsconfig.dev.json && npx integ-runner');
project.synth();
