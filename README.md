# Deploy-time Build
AWS CDK L3 construct that enables you to build apps during deploy time, aiming to resolve a few problems when we deploy frontend apps from CDK.

![architecture](./imgs/architecture.png)

## Usage
Install from npm:

```sh
npm i deploy-time-build
```
### Build Node.js apps
Use the following code to build Node.js apps like React frontend:

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

### Build SOCI index for a container image
[Seekable OCI (SOCI)](https://docs.aws.amazon.com/AmazonECS/latest/userguide/container-considerations.html) is a way to help start tasks faster for Amazon ECS tasks on Fargate 1.4.0. You can build and push a SOCI index to use the feature by the following CDK code:

```ts
import { SociIndexBuild } from 'deploy-time-build;

const asset = new DockerImageAsset(this, 'Image', { directory: 'example-image' });
new SociIndexBuild(this, 'Index', { imageTag: asset.assetHash, repository: asset.repository });
// or using a utility method
SociIndexBuild.fromDockerImageAsset(this, 'Index2', asset);

// Use the asset for ECS Fargate tasks
import { AssetImage } from 'aws-cdk-lib/aws-ecs';
const assetImage = AssetImage.fromDockerImageAsset(asset);
```

The below image is the architecture for `SociIndexBuild` construct. We currently use [`soci-wrapper`](https://github.com/tmokmss/soci-wrapper) to build and push SOCI indices.

![soci-architecture](imgs/soci-architecture.png)

## Motivation - why do we need the `NodejsBuild` construct?
I talked about why this construct can be useful in some situations at CDK Day 2023. See the recording or slides below:

[Recording](https://www.youtube.com/live/b-nSH18gFQk?si=ogEZ2x1NixOj6J6j&t=373) | [Slides](https://speakerdeck.com/tmokmss/deploy-web-frontend-apps-with-aws-cdk)

## Considerations
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

## Development
Commands for maintainers:

```sh
# run test locally
yarn tsc -p tsconfig.dev.json
yarn integ-runner
yarn integ-runner --update-on-failed
```
