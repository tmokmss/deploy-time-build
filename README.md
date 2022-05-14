# Deploy-time Build
AWS CDK L3 construct that enables you to build apps during deploy time, which aims to resolve the problme when we deploy frontend apps.

## Usage
```ts
import { NodejsBuild } from 'deploy-time-build';

declare const api: apigateway.RestApi;
declare const dstBucket: s3.IBucket;
declare const distribution: cloudfront.IDistribution;
new NodejsBuild(this, 'ExampleBuild', {
    assets: [
        {
            assetProps: {
            path: 'example-app',
            exclude: ['dist', 'node_modules'],
            },
            commands: ['npm install'],
        },
    ],
    destinationBucket: dstBucket,
    outputSourceDirectory: 'dist',
    distribution,
    buildEnvironment: {
        VITE_API_ENDPOINT: api.url,
    },
});
```

Note that you can pass environment variable `VITE_API_ENDPOINT: api.url` to the construct, which is resolved on deploy time, and injected to the build environment (a vite process in this case.)
The resulting build artifacts will be deployed to `destinationBucket` using a [`s3-deployment.BucketDeployment`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_deployment.BucketDeployment.html) construct internally.

You can specify multiple input assets by `assets` property. These assets are extracted to a respective sub directory in a temporary directory. For example, assume you specified assets like the following:

```ts
assets: [
    {
        assetProps: {
            path: 'example-app',
            exclude: ['dist', 'node_modules'],
        },
        commands: ['npm install'],
    },
    {
        assetProps: {
          path: 'module1',
        }
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

Please check https://github.com/tmokmss/deploy-time-build/tree/main/example for a complete example.

## Background
Previously, 

### Build locally and deploy

### Use `S3Deployment.Source.data` to inject deploy-time values

## Solution

## Considerations

