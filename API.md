# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### NodejsBuild <a name="NodejsBuild" id="deploy-time-build.NodejsBuild"></a>

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

---

##### `node`<sup>Required</sup> <a name="node" id="deploy-time-build.NodejsBuild.property.node"></a>

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
| <code><a href="#deploy-time-build.NodejsBuildProps.property.outputSourceDirectory">outputSourceDirectory</a></code> | <code>string</code> | The path to the directory that contains your build artifacts (relative to the working directory.). |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.buildCommands">buildCommands</a></code> | <code>string[]</code> | Shell commands to build your project. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.buildEnvironment">buildEnvironment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables injected to the build environment. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.destinationKeyPrefix">destinationKeyPrefix</a></code> | <code>string</code> | Key prefix to deploy your build artifact. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.distribution">distribution</a></code> | <code>aws-cdk-lib.aws_cloudfront.IDistribution</code> | The distribution you are using to publish you build artifact. |
| <code><a href="#deploy-time-build.NodejsBuildProps.property.workingDirectory">workingDirectory</a></code> | <code>string</code> | The name of the working directory of build process in the build enironment. |

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

The path to the directory that contains your build artifacts (relative to the working directory.).

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

##### `workingDirectory`<sup>Optional</sup> <a name="workingDirectory" id="deploy-time-build.NodejsBuildProps.property.workingDirectory"></a>

```typescript
public readonly workingDirectory: string;
```

- *Type:* string
- *Default:* assetProps[0].assetProps.path

The name of the working directory of build process in the build enironment.

---



