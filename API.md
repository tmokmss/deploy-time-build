# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### ContainerImageBuild <a name="ContainerImageBuild" id="deploy-time-build.ContainerImageBuild"></a>

- *Implements:* aws-cdk-lib.aws_iam.IGrantable

Build a container image and push it to an ECR repository on deploy-time.

#### Initializers <a name="Initializers" id="deploy-time-build.ContainerImageBuild.Initializer"></a>

```typescript
import { ContainerImageBuild } from 'deploy-time-build'

new ContainerImageBuild(scope: Construct, id: string, props: ContainerImageBuildProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.ContainerImageBuild.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#deploy-time-build.ContainerImageBuild.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#deploy-time-build.ContainerImageBuild.Initializer.parameter.props">props</a></code> | <code><a href="#deploy-time-build.ContainerImageBuildProps">ContainerImageBuildProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="deploy-time-build.ContainerImageBuild.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="deploy-time-build.ContainerImageBuild.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="deploy-time-build.ContainerImageBuild.Initializer.parameter.props"></a>

- *Type:* <a href="#deploy-time-build.ContainerImageBuildProps">ContainerImageBuildProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.ContainerImageBuild.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#deploy-time-build.ContainerImageBuild.toEcsDockerImageCode">toEcsDockerImageCode</a></code> | Get the instance of {@link ContainerImage} for an ECS task definition. |
| <code><a href="#deploy-time-build.ContainerImageBuild.toLambdaDockerImageCode">toLambdaDockerImageCode</a></code> | Get the instance of {@link DockerImageCode} for a Lambda function image. |

---

##### `toString` <a name="toString" id="deploy-time-build.ContainerImageBuild.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `toEcsDockerImageCode` <a name="toEcsDockerImageCode" id="deploy-time-build.ContainerImageBuild.toEcsDockerImageCode"></a>

```typescript
public toEcsDockerImageCode(): EcrImage
```

Get the instance of {@link ContainerImage} for an ECS task definition.

##### `toLambdaDockerImageCode` <a name="toLambdaDockerImageCode" id="deploy-time-build.ContainerImageBuild.toLambdaDockerImageCode"></a>

```typescript
public toLambdaDockerImageCode(): DockerImageCode
```

Get the instance of {@link DockerImageCode} for a Lambda function image.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.ContainerImageBuild.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="deploy-time-build.ContainerImageBuild.isConstruct"></a>

```typescript
import { ContainerImageBuild } from 'deploy-time-build'

ContainerImageBuild.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="deploy-time-build.ContainerImageBuild.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.ContainerImageBuild.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#deploy-time-build.ContainerImageBuild.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to. |
| <code><a href="#deploy-time-build.ContainerImageBuild.property.imageTag">imageTag</a></code> | <code>string</code> | *No description.* |
| <code><a href="#deploy-time-build.ContainerImageBuild.property.repository">repository</a></code> | <code>aws-cdk-lib.aws_ecr.IRepository</code> | *No description.* |

---

##### `node`<sup>Required</sup> <a name="node" id="deploy-time-build.ContainerImageBuild.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `grantPrincipal`<sup>Required</sup> <a name="grantPrincipal" id="deploy-time-build.ContainerImageBuild.property.grantPrincipal"></a>

```typescript
public readonly grantPrincipal: IPrincipal;
```

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

The principal to grant permissions to.

---

##### `imageTag`<sup>Required</sup> <a name="imageTag" id="deploy-time-build.ContainerImageBuild.property.imageTag"></a>

```typescript
public readonly imageTag: string;
```

- *Type:* string

---

##### `repository`<sup>Required</sup> <a name="repository" id="deploy-time-build.ContainerImageBuild.property.repository"></a>

```typescript
public readonly repository: IRepository;
```

- *Type:* aws-cdk-lib.aws_ecr.IRepository

---


### NodejsBuild <a name="NodejsBuild" id="deploy-time-build.NodejsBuild"></a>

- *Implements:* aws-cdk-lib.aws_iam.IGrantable

Build Node.js app and optionally publish the artifact to an S3 bucket.

#### Initializers <a name="Initializers" id="deploy-time-build.NodejsBuild.Initializer"></a>

```typescript
import { NodejsBuild } from 'deploy-time-build'

new NodejsBuild(scope: Construct, id: string, props: NodejsBuildProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.NodejsBuild.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#deploy-time-build.NodejsBuild.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#deploy-time-build.NodejsBuild.Initializer.parameter.props">props</a></code> | <code><a href="#deploy-time-build.NodejsBuildProps">NodejsBuildProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="deploy-time-build.NodejsBuild.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="deploy-time-build.NodejsBuild.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="deploy-time-build.NodejsBuild.Initializer.parameter.props"></a>

- *Type:* <a href="#deploy-time-build.NodejsBuildProps">NodejsBuildProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.NodejsBuild.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="deploy-time-build.NodejsBuild.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.NodejsBuild.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="deploy-time-build.NodejsBuild.isConstruct"></a>

```typescript
import { NodejsBuild } from 'deploy-time-build'

NodejsBuild.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="deploy-time-build.NodejsBuild.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.NodejsBuild.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#deploy-time-build.NodejsBuild.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to. |

---

##### `node`<sup>Required</sup> <a name="node" id="deploy-time-build.NodejsBuild.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `grantPrincipal`<sup>Required</sup> <a name="grantPrincipal" id="deploy-time-build.NodejsBuild.property.grantPrincipal"></a>

```typescript
public readonly grantPrincipal: IPrincipal;
```

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

The principal to grant permissions to.

---


### SociIndexBuild <a name="SociIndexBuild" id="deploy-time-build.SociIndexBuild"></a>

Build and publish a SOCI index for a container image.

A SOCI index helps start Fargate tasks faster in some cases.
Please read the following document for more details: https://docs.aws.amazon.com/AmazonECS/latest/userguide/container-considerations.html

#### Initializers <a name="Initializers" id="deploy-time-build.SociIndexBuild.Initializer"></a>

```typescript
import { SociIndexBuild } from 'deploy-time-build'

new SociIndexBuild(scope: Construct, id: string, props: SociIndexBuildProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.SociIndexBuild.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#deploy-time-build.SociIndexBuild.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#deploy-time-build.SociIndexBuild.Initializer.parameter.props">props</a></code> | <code><a href="#deploy-time-build.SociIndexBuildProps">SociIndexBuildProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="deploy-time-build.SociIndexBuild.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="deploy-time-build.SociIndexBuild.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="deploy-time-build.SociIndexBuild.Initializer.parameter.props"></a>

- *Type:* <a href="#deploy-time-build.SociIndexBuildProps">SociIndexBuildProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.SociIndexBuild.toString">toString</a></code> | Returns a string representation of this construct. |

---

##### `toString` <a name="toString" id="deploy-time-build.SociIndexBuild.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#deploy-time-build.SociIndexBuild.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#deploy-time-build.SociIndexBuild.fromDockerImageAsset">fromDockerImageAsset</a></code> | A utility method to create a SociIndexBuild construct from a DockerImageAsset instance. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="deploy-time-build.SociIndexBuild.isConstruct"></a>

```typescript
import { SociIndexBuild } from 'deploy-time-build'

SociIndexBuild.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="deploy-time-build.SociIndexBuild.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `fromDockerImageAsset` <a name="fromDockerImageAsset" id="deploy-time-build.SociIndexBuild.fromDockerImageAsset"></a>

```typescript
import { SociIndexBuild } from 'deploy-time-build'

SociIndexBuild.fromDockerImageAsset(scope: Construct, id: string, imageAsset: DockerImageAsset)
```

A utility method to create a SociIndexBuild construct from a DockerImageAsset instance.

###### `scope`<sup>Required</sup> <a name="scope" id="deploy-time-build.SociIndexBuild.fromDockerImageAsset.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="deploy-time-build.SociIndexBuild.fromDockerImageAsset.parameter.id"></a>

- *Type:* string

---

###### `imageAsset`<sup>Required</sup> <a name="imageAsset" id="deploy-time-build.SociIndexBuild.fromDockerImageAsset.parameter.imageAsset"></a>

- *Type:* aws-cdk-lib.aws_ecr_assets.DockerImageAsset

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.SociIndexBuild.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="deploy-time-build.SociIndexBuild.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### AssetConfig <a name="AssetConfig" id="deploy-time-build.AssetConfig"></a>

#### Initializer <a name="Initializer" id="deploy-time-build.AssetConfig.Initializer"></a>

```typescript
import { AssetConfig } from 'deploy-time-build'

const assetConfig: AssetConfig = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.AssetConfig.property.assetHash">assetHash</a></code> | <code>string</code> | Specify a custom hash for this asset. |
| <code><a href="#deploy-time-build.AssetConfig.property.assetHashType">assetHashType</a></code> | <code>aws-cdk-lib.AssetHashType</code> | Specifies the type of hash to calculate for this asset. |
| <code><a href="#deploy-time-build.AssetConfig.property.bundling">bundling</a></code> | <code>aws-cdk-lib.BundlingOptions</code> | Bundle the asset by executing a command in a Docker container or a custom bundling provider. |
| <code><a href="#deploy-time-build.AssetConfig.property.exclude">exclude</a></code> | <code>string[]</code> | File paths matching the patterns will be excluded. |
| <code><a href="#deploy-time-build.AssetConfig.property.followSymlinks">followSymlinks</a></code> | <code>aws-cdk-lib.SymlinkFollowMode</code> | A strategy for how to handle symlinks. |
| <code><a href="#deploy-time-build.AssetConfig.property.ignoreMode">ignoreMode</a></code> | <code>aws-cdk-lib.IgnoreMode</code> | The ignore behavior to use for `exclude` patterns. |
| <code><a href="#deploy-time-build.AssetConfig.property.readers">readers</a></code> | <code>aws-cdk-lib.aws_iam.IGrantable[]</code> | A list of principals that should be able to read this asset from S3. |
| <code><a href="#deploy-time-build.AssetConfig.property.path">path</a></code> | <code>string</code> | The disk location of the asset. |
| <code><a href="#deploy-time-build.AssetConfig.property.commands">commands</a></code> | <code>string[]</code> | Shell commands executed right after the asset zip is extracted to the build environment. |
| <code><a href="#deploy-time-build.AssetConfig.property.extractPath">extractPath</a></code> | <code>string</code> | Relative path from a build directory to the directory where the asset is extracted. |

---

##### `assetHash`<sup>Optional</sup> <a name="assetHash" id="deploy-time-build.AssetConfig.property.assetHash"></a>

```typescript
public readonly assetHash: string;
```

- *Type:* string
- *Default:* based on `assetHashType`

Specify a custom hash for this asset.

If `assetHashType` is set it must
be set to `AssetHashType.CUSTOM`. For consistency, this custom hash will
be SHA256 hashed and encoded as hex. The resulting hash will be the asset
hash.

NOTE: the hash is used in order to identify a specific revision of the asset, and
used for optimizing and caching deployment activities related to this asset such as
packaging, uploading to Amazon S3, etc. If you chose to customize the hash, you will
need to make sure it is updated every time the asset changes, or otherwise it is
possible that some deployments will not be invalidated.

---

##### `assetHashType`<sup>Optional</sup> <a name="assetHashType" id="deploy-time-build.AssetConfig.property.assetHashType"></a>

```typescript
public readonly assetHashType: AssetHashType;
```

- *Type:* aws-cdk-lib.AssetHashType
- *Default:* the default is `AssetHashType.SOURCE`, but if `assetHash` is explicitly specified this value defaults to `AssetHashType.CUSTOM`.

Specifies the type of hash to calculate for this asset.

If `assetHash` is configured, this option must be `undefined` or
`AssetHashType.CUSTOM`.

---

##### `bundling`<sup>Optional</sup> <a name="bundling" id="deploy-time-build.AssetConfig.property.bundling"></a>

```typescript
public readonly bundling: BundlingOptions;
```

- *Type:* aws-cdk-lib.BundlingOptions
- *Default:* uploaded as-is to S3 if the asset is a regular file or a .zip file, archived into a .zip file and uploaded to S3 otherwise

Bundle the asset by executing a command in a Docker container or a custom bundling provider.

The asset path will be mounted at `/asset-input`. The Docker
container is responsible for putting content at `/asset-output`.
The content at `/asset-output` will be zipped and used as the
final asset.

---

##### `exclude`<sup>Optional</sup> <a name="exclude" id="deploy-time-build.AssetConfig.property.exclude"></a>

```typescript
public readonly exclude: string[];
```

- *Type:* string[]
- *Default:* nothing is excluded

File paths matching the patterns will be excluded.

See `ignoreMode` to set the matching behavior.
Has no effect on Assets bundled using the `bundling` property.

---

##### `followSymlinks`<sup>Optional</sup> <a name="followSymlinks" id="deploy-time-build.AssetConfig.property.followSymlinks"></a>

```typescript
public readonly followSymlinks: SymlinkFollowMode;
```

- *Type:* aws-cdk-lib.SymlinkFollowMode
- *Default:* SymlinkFollowMode.NEVER

A strategy for how to handle symlinks.

---

##### `ignoreMode`<sup>Optional</sup> <a name="ignoreMode" id="deploy-time-build.AssetConfig.property.ignoreMode"></a>

```typescript
public readonly ignoreMode: IgnoreMode;
```

- *Type:* aws-cdk-lib.IgnoreMode
- *Default:* IgnoreMode.GLOB

The ignore behavior to use for `exclude` patterns.

---

##### `readers`<sup>Optional</sup> <a name="readers" id="deploy-time-build.AssetConfig.property.readers"></a>

```typescript
public readonly readers: IGrantable[];
```

- *Type:* aws-cdk-lib.aws_iam.IGrantable[]
- *Default:* No principals that can read file asset.

A list of principals that should be able to read this asset from S3.

You can use `asset.grantRead(principal)` to grant read permissions later.

---

##### `path`<sup>Required</sup> <a name="path" id="deploy-time-build.AssetConfig.property.path"></a>

```typescript
public readonly path: string;
```

- *Type:* string

The disk location of the asset.

The path should refer to one of the following:
- A regular file or a .zip file, in which case the file will be uploaded as-is to S3.
- A directory, in which case it will be archived into a .zip file and uploaded to S3.

---

##### `commands`<sup>Optional</sup> <a name="commands" id="deploy-time-build.AssetConfig.property.commands"></a>

```typescript
public readonly commands: string[];
```

- *Type:* string[]
- *Default:* No command is executed.

Shell commands executed right after the asset zip is extracted to the build environment.

---

##### `extractPath`<sup>Optional</sup> <a name="extractPath" id="deploy-time-build.AssetConfig.property.extractPath"></a>

```typescript
public readonly extractPath: string;
```

- *Type:* string
- *Default:* basename of the asset path.

Relative path from a build directory to the directory where the asset is extracted.

---

### ContainerImageBuildProps <a name="ContainerImageBuildProps" id="deploy-time-build.ContainerImageBuildProps"></a>

#### Initializer <a name="Initializer" id="deploy-time-build.ContainerImageBuildProps.Initializer"></a>

```typescript
import { ContainerImageBuildProps } from 'deploy-time-build'

const containerImageBuildProps: ContainerImageBuildProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.exclude">exclude</a></code> | <code>string[]</code> | File paths matching the patterns will be excluded. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.followSymlinks">followSymlinks</a></code> | <code>aws-cdk-lib.SymlinkFollowMode</code> | A strategy for how to handle symlinks. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.ignoreMode">ignoreMode</a></code> | <code>aws-cdk-lib.IgnoreMode</code> | The ignore behavior to use for `exclude` patterns. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.extraHash">extraHash</a></code> | <code>string</code> | Extra information to encode into the fingerprint (e.g. build instructions and other inputs). |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.buildArgs">buildArgs</a></code> | <code>{[ key: string ]: string}</code> | Build args to pass to the `docker build` command. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.file">file</a></code> | <code>string</code> | Path to the Dockerfile (relative to the directory). |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.invalidation">invalidation</a></code> | <code>aws-cdk-lib.aws_ecr_assets.DockerImageAssetInvalidationOptions</code> | Options to control which parameters are used to invalidate the asset hash. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.networkMode">networkMode</a></code> | <code>aws-cdk-lib.aws_ecr_assets.NetworkMode</code> | Networking mode for the RUN commands during build. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.platform">platform</a></code> | <code>aws-cdk-lib.aws_ecr_assets.Platform</code> | Platform to build for. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.target">target</a></code> | <code>string</code> | Docker target to build to. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.directory">directory</a></code> | <code>string</code> | The directory where the Dockerfile is stored. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.repository">repository</a></code> | <code>aws-cdk-lib.aws_ecr.IRepository</code> | The ECR repository to push the image. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.tag">tag</a></code> | <code>string</code> | The tag when to push the image. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.vpc">vpc</a></code> | <code>aws-cdk-lib.aws_ec2.IVpc</code> | The VPC where your build job will be deployed. This VPC must have private subnets with NAT Gateways. |
| <code><a href="#deploy-time-build.ContainerImageBuildProps.property.zstdCompression">zstdCompression</a></code> | <code>boolean</code> | Use zstd for compressing a container image. |

---

##### `exclude`<sup>Optional</sup> <a name="exclude" id="deploy-time-build.ContainerImageBuildProps.property.exclude"></a>

```typescript
public readonly exclude: string[];
```

- *Type:* string[]
- *Default:* nothing is excluded

File paths matching the patterns will be excluded.

See `ignoreMode` to set the matching behavior.
Has no effect on Assets bundled using the `bundling` property.

---

##### `followSymlinks`<sup>Optional</sup> <a name="followSymlinks" id="deploy-time-build.ContainerImageBuildProps.property.followSymlinks"></a>

```typescript
public readonly followSymlinks: SymlinkFollowMode;
```

- *Type:* aws-cdk-lib.SymlinkFollowMode
- *Default:* SymlinkFollowMode.NEVER

A strategy for how to handle symlinks.

---

##### `ignoreMode`<sup>Optional</sup> <a name="ignoreMode" id="deploy-time-build.ContainerImageBuildProps.property.ignoreMode"></a>

```typescript
public readonly ignoreMode: IgnoreMode;
```

- *Type:* aws-cdk-lib.IgnoreMode
- *Default:* IgnoreMode.GLOB

The ignore behavior to use for `exclude` patterns.

---

##### `extraHash`<sup>Optional</sup> <a name="extraHash" id="deploy-time-build.ContainerImageBuildProps.property.extraHash"></a>

```typescript
public readonly extraHash: string;
```

- *Type:* string
- *Default:* hash is only based on source content

Extra information to encode into the fingerprint (e.g. build instructions and other inputs).

---

##### `buildArgs`<sup>Optional</sup> <a name="buildArgs" id="deploy-time-build.ContainerImageBuildProps.property.buildArgs"></a>

```typescript
public readonly buildArgs: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* no build args are passed

Build args to pass to the `docker build` command.

Since Docker build arguments are resolved before deployment, keys and
values cannot refer to unresolved tokens (such as `lambda.functionArn` or
`queue.queueUrl`).

---

##### `file`<sup>Optional</sup> <a name="file" id="deploy-time-build.ContainerImageBuildProps.property.file"></a>

```typescript
public readonly file: string;
```

- *Type:* string
- *Default:* 'Dockerfile'

Path to the Dockerfile (relative to the directory).

---

##### `invalidation`<sup>Optional</sup> <a name="invalidation" id="deploy-time-build.ContainerImageBuildProps.property.invalidation"></a>

```typescript
public readonly invalidation: DockerImageAssetInvalidationOptions;
```

- *Type:* aws-cdk-lib.aws_ecr_assets.DockerImageAssetInvalidationOptions
- *Default:* hash all parameters

Options to control which parameters are used to invalidate the asset hash.

---

##### `networkMode`<sup>Optional</sup> <a name="networkMode" id="deploy-time-build.ContainerImageBuildProps.property.networkMode"></a>

```typescript
public readonly networkMode: NetworkMode;
```

- *Type:* aws-cdk-lib.aws_ecr_assets.NetworkMode
- *Default:* no networking mode specified (the default networking mode `NetworkMode.DEFAULT` will be used)

Networking mode for the RUN commands during build.

Support docker API 1.25+.

---

##### `platform`<sup>Optional</sup> <a name="platform" id="deploy-time-build.ContainerImageBuildProps.property.platform"></a>

```typescript
public readonly platform: Platform;
```

- *Type:* aws-cdk-lib.aws_ecr_assets.Platform
- *Default:* no platform specified (the current machine architecture will be used)

Platform to build for.

_Requires Docker Buildx_.

---

##### `target`<sup>Optional</sup> <a name="target" id="deploy-time-build.ContainerImageBuildProps.property.target"></a>

```typescript
public readonly target: string;
```

- *Type:* string
- *Default:* no target

Docker target to build to.

---

##### `directory`<sup>Required</sup> <a name="directory" id="deploy-time-build.ContainerImageBuildProps.property.directory"></a>

```typescript
public readonly directory: string;
```

- *Type:* string

The directory where the Dockerfile is stored.

Any directory inside with a name that matches the CDK output folder (cdk.out by default) will be excluded from the asset

---

##### `repository`<sup>Optional</sup> <a name="repository" id="deploy-time-build.ContainerImageBuildProps.property.repository"></a>

```typescript
public readonly repository: IRepository;
```

- *Type:* aws-cdk-lib.aws_ecr.IRepository
- *Default:* create a new ECR repository

The ECR repository to push the image.

---

##### `tag`<sup>Optional</sup> <a name="tag" id="deploy-time-build.ContainerImageBuildProps.property.tag"></a>

```typescript
public readonly tag: string;
```

- *Type:* string
- *Default:* use assetHash as tag

The tag when to push the image.

---

##### `vpc`<sup>Optional</sup> <a name="vpc" id="deploy-time-build.ContainerImageBuildProps.property.vpc"></a>

```typescript
public readonly vpc: IVpc;
```

- *Type:* aws-cdk-lib.aws_ec2.IVpc
- *Default:* No VPC used.

The VPC where your build job will be deployed. This VPC must have private subnets with NAT Gateways.

Use this property when you want to control the outbound IP addresses that base images are pulled from.

---

##### `zstdCompression`<sup>Optional</sup> <a name="zstdCompression" id="deploy-time-build.ContainerImageBuildProps.property.zstdCompression"></a>

```typescript
public readonly zstdCompression: boolean;
```

- *Type:* boolean
- *Default:* false

Use zstd for compressing a container image.

---

### NodejsBuildProps <a name="NodejsBuildProps" id="deploy-time-build.NodejsBuildProps"></a>

#### Initializer <a name="Initializer" id="deploy-time-build.NodejsBuildProps.Initializer"></a>

```typescript
import { NodejsBuildProps } from 'deploy-time-build'

const nodejsBuildProps: NodejsBuildProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.assets">assets</a></code> | <code><a href="#deploy-time-build.AssetConfig">AssetConfig</a>[]</code> | The AssetProps from which s3-assets are created and copied to the build environment. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.destinationBucket">destinationBucket</a></code> | <code>aws-cdk-lib.aws_s3.IBucket</code> | S3 Bucket to which your build artifacts are finally deployed. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.outputSourceDirectory">outputSourceDirectory</a></code> | <code>string</code> | Relative path from the working directory to the directory where the build artifacts are output. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.buildCommands">buildCommands</a></code> | <code>string[]</code> | Shell commands to build your project. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.buildEnvironment">buildEnvironment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables injected to the build environment. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.destinationKeyPrefix">destinationKeyPrefix</a></code> | <code>string</code> | Key prefix to deploy your build artifact. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.distribution">distribution</a></code> | <code>aws-cdk-lib.aws_cloudfront.IDistribution</code> | The distribution you are using to publish you build artifact. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.excludeCommonFiles">excludeCommonFiles</a></code> | <code>boolean</code> | If true, common unnecessary files/directories such as .DS_Store, .git, node_modules, etc are excluded from the assets by default. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.nodejsVersion">nodejsVersion</a></code> | <code>number</code> | The version of Node.js to use in a build environment. Available versions: 12, 14, 16, 18, 20. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.outputEnvFile">outputEnvFile</a></code> | <code>boolean</code> | If true, a .env file is uploaded to an S3 bucket with values of `buildEnvironment` property. You can copy it to your local machine by running the command in the stack output. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.workingDirectory">workingDirectory</a></code> | <code>string</code> | Relative path from the build directory to the directory where build commands run. |

---

##### `assets`<sup>Required</sup> <a name="assets" id="deploy-time-build.NodejsBuildProps.property.assets"></a>

```typescript
public readonly assets: AssetConfig[];
```

- *Type:* <a href="#deploy-time-build.AssetConfig">AssetConfig</a>[]

The AssetProps from which s3-assets are created and copied to the build environment.

---

##### `destinationBucket`<sup>Required</sup> <a name="destinationBucket" id="deploy-time-build.NodejsBuildProps.property.destinationBucket"></a>

```typescript
public readonly destinationBucket: IBucket;
```

- *Type:* aws-cdk-lib.aws_s3.IBucket

S3 Bucket to which your build artifacts are finally deployed.

---

##### `outputSourceDirectory`<sup>Required</sup> <a name="outputSourceDirectory" id="deploy-time-build.NodejsBuildProps.property.outputSourceDirectory"></a>

```typescript
public readonly outputSourceDirectory: string;
```

- *Type:* string

Relative path from the working directory to the directory where the build artifacts are output.

---

##### `buildCommands`<sup>Optional</sup> <a name="buildCommands" id="deploy-time-build.NodejsBuildProps.property.buildCommands"></a>

```typescript
public readonly buildCommands: string[];
```

- *Type:* string[]
- *Default:* ['npm run build']

Shell commands to build your project.

They are executed on the working directory you specified.

---

##### `buildEnvironment`<sup>Optional</sup> <a name="buildEnvironment" id="deploy-time-build.NodejsBuildProps.property.buildEnvironment"></a>

```typescript
public readonly buildEnvironment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* {}

Environment variables injected to the build environment.

You can use CDK deploy-time values as well as literals.

---

##### `destinationKeyPrefix`<sup>Optional</sup> <a name="destinationKeyPrefix" id="deploy-time-build.NodejsBuildProps.property.destinationKeyPrefix"></a>

```typescript
public readonly destinationKeyPrefix: string;
```

- *Type:* string
- *Default:* '/'

Key prefix to deploy your build artifact.

---

##### `distribution`<sup>Optional</sup> <a name="distribution" id="deploy-time-build.NodejsBuildProps.property.distribution"></a>

```typescript
public readonly distribution: IDistribution;
```

- *Type:* aws-cdk-lib.aws_cloudfront.IDistribution
- *Default:* No distribution

The distribution you are using to publish you build artifact.

If any specified, the caches are invalidated on new artifact deployments.

---

##### `excludeCommonFiles`<sup>Optional</sup> <a name="excludeCommonFiles" id="deploy-time-build.NodejsBuildProps.property.excludeCommonFiles"></a>

```typescript
public readonly excludeCommonFiles: boolean;
```

- *Type:* boolean
- *Default:* true

If true, common unnecessary files/directories such as .DS_Store, .git, node_modules, etc are excluded from the assets by default.

---

##### `nodejsVersion`<sup>Optional</sup> <a name="nodejsVersion" id="deploy-time-build.NodejsBuildProps.property.nodejsVersion"></a>

```typescript
public readonly nodejsVersion: number;
```

- *Type:* number
- *Default:* 18

The version of Node.js to use in a build environment. Available versions: 12, 14, 16, 18, 20.

---

##### `outputEnvFile`<sup>Optional</sup> <a name="outputEnvFile" id="deploy-time-build.NodejsBuildProps.property.outputEnvFile"></a>

```typescript
public readonly outputEnvFile: boolean;
```

- *Type:* boolean
- *Default:* false

If true, a .env file is uploaded to an S3 bucket with values of `buildEnvironment` property. You can copy it to your local machine by running the command in the stack output.

---

##### `workingDirectory`<sup>Optional</sup> <a name="workingDirectory" id="deploy-time-build.NodejsBuildProps.property.workingDirectory"></a>

```typescript
public readonly workingDirectory: string;
```

- *Type:* string
- *Default:* assetProps[0].extractPath

Relative path from the build directory to the directory where build commands run.

---

### SociIndexBuildProps <a name="SociIndexBuildProps" id="deploy-time-build.SociIndexBuildProps"></a>

#### Initializer <a name="Initializer" id="deploy-time-build.SociIndexBuildProps.Initializer"></a>

```typescript
import { SociIndexBuildProps } from 'deploy-time-build'

const sociIndexBuildProps: SociIndexBuildProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#deploy-time-build.SociIndexBuildProps.property.imageTag">imageTag</a></code> | <code>string</code> | The tag of the container image you want to build index for. |
| <code><a href="#deploy-time-build.SociIndexBuildProps.property.repository">repository</a></code> | <code>aws-cdk-lib.aws_ecr.IRepository</code> | The ECR repository your container image is stored. |

---

##### `imageTag`<sup>Required</sup> <a name="imageTag" id="deploy-time-build.SociIndexBuildProps.property.imageTag"></a>

```typescript
public readonly imageTag: string;
```

- *Type:* string

The tag of the container image you want to build index for.

---

##### `repository`<sup>Required</sup> <a name="repository" id="deploy-time-build.SociIndexBuildProps.property.repository"></a>

```typescript
public readonly repository: IRepository;
```

- *Type:* aws-cdk-lib.aws_ecr.IRepository

The ECR repository your container image is stored.

You can only specify a repository in the same environment (account/region).
The index artifact will be uploaded to this repository.

---



