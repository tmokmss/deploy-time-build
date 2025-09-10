import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkConstructLibrary({
  projenrcTs: true,
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  // we don't strictly guarantee it works in older CDK (integ-runner runs on newer CDK), but hopefully it should.
  cdkVersion: '2.38.0', // For using @aws-cdk/integ-runner
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.8.0',
  name: 'deploy-time-build',
  license: 'MIT',
  repositoryUrl: 'https://github.com/tmokmss/deploy-time-build.git',
  npmTrustedPublishing: true,
  publishToPypi: {
    distName: 'deploy-time-build',
    module: 'deploy_time_build',
    trustedPublishing: true,
  },
  packageManager: NodePackageManager.NPM,
  workflowNodeVersion: '24',
  eslintOptions: {
    dirs: [],
    ignorePatterns: ['example/**/*', 'lambda/**/*', 'test/assets/**/*', 'test/*.snapshot/**/*', '*.d.ts'],
  },
  gitignore: ['*.js', '*.d.ts', '!test/*.snapshot/**/*'],
  keywords: ['aws', 'cdk', 'lambda', 'aws-cdk', 'ecr', 'ecs'],
  tsconfigDev: {
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
    exclude: ['example', 'test/*.snapshot'],
  },
  tsconfig: {
    compilerOptions: {
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
  },
  devDeps: [
    'aws-cdk-lib@^2.159.0',
    'aws-cdk@^2.159.0',
    'constructs',
    '@aws-cdk/integ-runner@^2.159.0-alpha.0',
    '@aws-cdk/integ-tests-alpha@^2.159.0-alpha.0',
  ],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
  description: 'Build during CDK deployment.',
});
project.eslint?.addRules({
  '@typescript-eslint/no-unused-vars': 'off',
});
// Bundle custom resource handler Lambda code
project.projectBuild.postCompileTask.prependExec('npm ci && npm run build', {
  cwd: 'lambda/trigger-codebuild',
});
// Run integ-test
project.projectBuild.testTask.exec('npx tsc -p tsconfig.dev.json && npx integ-runner');
project.synth();
