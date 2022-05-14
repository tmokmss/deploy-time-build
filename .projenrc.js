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
  keywords: ['aws', 'cdk', 'lambda'],
  tsconfig: {
  },
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
// Bundle custom resource handler Lambda code
project.projectBuild.compileTask.prependExec('npm install && npm run build', {cwd: 'lambda/nodejs-build'});
project.synth();
