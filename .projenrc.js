const { awscdk } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Masashi Tomooka',
  authorAddress: 'mtomooka@amazon.co.jp',
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'deploy-time-build',
  repositoryUrl: 'https://github.com/mtomooka/deploy-time-build.git',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();