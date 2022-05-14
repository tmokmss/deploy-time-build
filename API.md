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
| <code><a href="#deploy-time-build.AssetConfig.property.assetProps">assetProps</a></code> | <code>aws-cdk-lib.aws_s3_assets.AssetProps</code> | AssetProps for the asset. |
| <code><a href="#deploy-time-build.AssetConfig.property.commands">commands</a></code> | <code>string[]</code> | Shell commands executed right after the asset zip is extracted to the build environment. |

---

##### `assetProps`<sup>Required</sup> <a name="assetProps" id="deploy-time-build.AssetConfig.property.assetProps"></a>

```typescript
public readonly assetProps: AssetProps;
```

- *Type:* aws-cdk-lib.aws_s3_assets.AssetProps

AssetProps for the asset.

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
- *Default:* assetProps[0].path

The name of the working directory of build process in the build enironment.

---



