const { awscdk } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'tmokmss',
  authorAddress: 'tomookam@live.jp',
  cdkVersion: '2.20.0',
  defaultReleaseBranch: 'main',
  name: 'deploy-time-build',
  repositoryUrl: 'https://github.com/tmokmss/deploy-time-build.git',
  eslintOptions: {
    ignorePatterns: ['example/**/*'],
  },
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();