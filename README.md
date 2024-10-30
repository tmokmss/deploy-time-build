# Deploy-time Build
AWS CDK L3 construct that allows you to run a build job for specific purposes. Currently this library supports the following use cases:

* Build web frontend static files
* Build a container image
* Build Seekable OCI (SOCI) indices for container images

## Usage
Install from npm:

```sh
npm i deploy-time-build
```

This library defines several L3 constructs for specific use cases. Here is the usage for each case.

### Build Node.js apps

You can build a Node.js app such as a React frontend app on deploy time by the `NodejsBuild` construct.

![architecture](./imgs/architecture.png)

The following code is an example to use the construct:

```ts
import { NodejsBuild } from 'deploy-time-build';

declare const api: apigateway.RestApi;
declare const destinationBucket: s3.IBucket;
declare const distribution: cloudfront.IDistribution;
new NodejsBuild(this, 'ExampleBuild', {
    assets: [
        {
            path: 'example-app',
            exclude: ['dist', 'node_modules'],
        },
    ],
    destinationBucket,
    distribution,
    outputSourceDirectory: 'dist',
    buildCommands: ['npm ci', 'npm run build'],
    buildEnvironment: {
        VITE_API_ENDPOINT: api.url,
    },
});
```

Note that it is possible to pass environment variable `VITE_API_ENDPOINT: api.url` to the construct, which is resolved on deploy time, and injected to the build environment (a vite process in this case.)
The resulting build artifacts will be deployed to `destinationBucket` using a [`s3-deployment.BucketDeployment`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_deployment.BucketDeployment.html) construct.

You can specify multiple input assets by `assets` property. These assets are extracted to respective sub directories. For example, assume you specified assets like the following:

```ts
assets: [
    {
        // directory containing source code and package.json
        path: 'example-app',
        exclude: ['dist', 'node_modules'],
        commands: ['npm install'],
    },
    {
        // directory that is also required for the build
        path: 'module1',
    },
],
```

Then, the extracted directories will be located as the following:

```sh
.                         # a temporary directory (automatically created)
├── example-app           # extracted example-app assets
│   ├── src/              # dist or node_modules directories are excluded even if they exist locally.
│   ├── package.json      # npm install will be executed since its specified in `commands` property.
│   └── package-lock.json
└── module1               # extracted module1 assets
```

You can also override the path where assets are extracted by `extractPath` property for each asset.

With `outputEnvFile` property enabled, a `.env` file is automatically generated and uploaded to your S3 bucket. This file can be used running you frontend project locally. You can download the file to your local machine by running the command added in the stack output.

Please also check [the example directory](./example/) for a complete example. 

#### Allowing access from the build environment to other AWS resources
Since `NodejsBuild` construct implements [`iam.IGrantable`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IGrantable.html) interface, you can use `grant*` method of other constructs to allow access from the build environment.

```ts
declare const someBucket: s3.IBucket;
declare const build: NodejsBuild;
someBucket.grantReadWrite(build);
```

You can also use [`iam.Grant`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.Grant.html) class to allow any actions and resources.

```ts
declare const build: NodejsBuild;
iam.Grant.addToPrincipal({ grantee: build, actions: ['s3:ListBucket'], resources:['*'] })
```

#### Motivation - why do we need the `NodejsBuild` construct?
I talked about why this construct can be useful in some situations at CDK Day 2023. See the recording or slides below:

[Recording](https://www.youtube.com/live/b-nSH18gFQk?si=ogEZ2x1NixOj6J6j&t=373) | [Slides](https://speakerdeck.com/tmokmss/deploy-web-frontend-apps-with-aws-cdk)

#### Considerations
Since this construct builds your frontend apps every time you deploy the stack and there is any change in input assets (and currently there's even no build cache in the Lambda function!), the time a deployment takes tends to be longer (e.g. a few minutes even for the simple app in `example` directory.) This might results in worse developer experience if you want to deploy changes frequently (imagine `cdk watch` deployment always re-build your frontend app).

To mitigate this issue, you can separate the stack for frontend construct from other stacks especially for a dev environment. Another solution would be to set a fixed string as an asset hash, and avoid builds on every deployment.

```ts
      assets: [
        {
          path: '../frontend',
          exclude: ['node_modules', 'dist'],
          commands: ['npm ci'],
          // Set a fixed string as a asset hash to prevent deploying changes.
          // This can be useful for an environment you use to develop locally.
          assetHash: 'frontend_asset',
        },
      ],
```

### Build a container image
You can build a container image at deploy time by the following code:

```ts
import { ContainerImageBuild } from 'deploy-time-build';

const image = new ContainerImageBuild(this, 'Build', { 
    directory: 'example-image', 
    buildArgs: { DUMMY_FILE_SIZE_MB: '15' },
    tag: 'my-image-tag',
});
new DockerImageFunction(this, 'Function', {
    code: image.toLambdaDockerImageCode(),
});
const armImage = new ContainerImageBuild(this, 'BuildArm', {
    directory: 'example-image',
    platform: Platform.LINUX_ARM64,
    repository: image.repository,
    zstdCompression: true,
});
new FargateTaskDefinition(this, 'TaskDefinition', { 
    runtimePlatform: { cpuArchitecture: CpuArchitecture.ARM64 } 
}).addContainer('main', {
    image: armImage.toEcsDockerImageCode(),
});
```

The third argument (props) are a superset of DockerImageAsset's properties. You can set a few additional properties such as `tag`, `repository`, and `zstdCompression`.

### Build SOCI index for a container image
[Seekable OCI (SOCI)](https://aws.amazon.com/about-aws/whats-new/2022/09/introducing-seekable-oci-lazy-loading-container-images/) is a way to help start tasks faster for Amazon ECS tasks on Fargate 1.4.0. You can build and push a SOCI index using the `SociIndexBuild` construct.

![soci-architecture](imgs/soci-architecture.png)

The following code is an example to use the construct:

```ts
import { SociIndexBuild } from 'deploy-time-build';

const asset = new DockerImageAsset(this, 'Image', { directory: 'example-image' });
new SociIndexBuild(this, 'Index', { imageTag: asset.assetHash, repository: asset.repository });
// or using a utility method
SociIndexBuild.fromDockerImageAsset(this, 'Index2', asset);

// Use the asset for ECS Fargate tasks
import { AssetImage } from 'aws-cdk-lib/aws-ecs';
const assetImage = AssetImage.fromDockerImageAsset(asset);
```

We currently use [`soci-wrapper`](https://github.com/tmokmss/soci-wrapper) to build and push SOCI indices.

#### Motivation - why do we need the `SociIndexBuild` construct?

Currently there are several other ways to build a SOCI index; 1. use `soci-snapshotter` CLI, or 2. use [cfn-ecr-aws-soci-index-builder](https://github.com/aws-ia/cfn-ecr-aws-soci-index-builder) solution, none of which can be directly used from AWS CDK. If you are familiar with CDK, you should often deploy container images as CDK assets, which is an ideal way to integrate with other L2 constructs such as ECS. To make the developer experience for SOCI as close as the ordinary container images, the `SociIndexBuild` allows you to deploying a SOCI index directly from CDK, without any dependencies outside of CDK context.

## Development
Commands for maintainers:

```sh
# run test locally
npx tsc -p tsconfig.dev.json
npx integ-runner
npx integ-runner --update-on-failed
```
