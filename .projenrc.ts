import { awscdk } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { NodePackageManager } from 'projen/lib/javascript';

const minCdkVersion = '2.38.0';
const minConstructsVersion = '10.0.5';

const project = new awscdk.AwsCdkConstructLibrary({
  projenrcTs: true,
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  cdkVersion: minCdkVersion,
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
project.projectBuild.testTask.exec('npx integ-runner');

// Verify minimum CDK version compatibility
project.buildWorkflow?.addPostBuildJob('verify-min-cdk-version', {
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.READ,
  },
  steps: [
    {
      name: 'Checkout',
      uses: 'actions/checkout@v4',
      with: {
        ref: '${{ github.event.pull_request.head.ref }}',
        repository: '${{ github.event.pull_request.head.repo.full_name }}',
      },
    },
    {
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: {
        'node-version': '24',
      },
    },
    {
      name: 'Install dependencies',
      run: 'npm ci',
    },
    {
      name: 'Build Lambda handler',
      run: 'npm ci && npm run build',
      workingDirectory: 'lambda/trigger-codebuild',
    },
    {
      name: 'Verify minimum CDK version compatibility',
      run: `./scripts/verify-min-cdk.sh ${minCdkVersion} ${minConstructsVersion}`,
    },
  ],
});

project.synth();
