import { Stack } from 'aws-cdk-lib';
import { Project, ProjectProps } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export interface SingletonProjectProps extends ProjectProps {
  /**
   * A unique identifier to identify this CodeBuild project.
   *
   * The identifier should be unique across all singleton projects. We recommend generating a UUID per project.
   */
  readonly uuid: string;

  /**
   * A descriptive name for the purpose of this CodeBuild project.
   *
   * If the project does not have a physical name, this string will be reflected its generated name. The combination of projectPurpose and uuid must be unique.
   *
   * @default SingletonProject
   */
  readonly projectPurpose?: string;
}

/**
 * A CodeBuild project that is created only once per stack.
 */
export class SingletonProject extends Construct {
  public readonly project: Project;

  constructor(scope: Construct, id: string, props: SingletonProjectProps) {
    super(scope, id);
    this.project = this.ensureProject(props);
  }

  private ensureProject(props: SingletonProjectProps): Project {
    const constructName = (props.projectPurpose ?? 'SingletonProject') + this.slugify(props.uuid, this.propsToAdditionalString(props));
    const existing = Stack.of(this).node.tryFindChild(constructName);
    if (existing) {
      return existing as Project;
    }

    return new Project(Stack.of(this), constructName, props);
  }

  private propsToAdditionalString(props: SingletonProjectProps) {
    // This string must be stable to avoid from replacement.
    // Things that can be added to the slug later (we have to create a new project per these properties):
    //   * vpc addr
    //   * instance type
    //   * platform (amd64/arm64)
    // But actually, replacement will not cause any disruption because of its stateless nature.
    let slug = '';
    slug += props.vpc?.node.addr ?? '';
    // Get platform info from environment.buildImage if available
    if (props.environment?.buildImage) {
      slug += props.environment.buildImage.toString().includes('aarch64') ? 'arm64' : 'amd64';
    }
    return slug;
  }

  private slugify(x: string, additionalString?: string): string {
    return `${x}${additionalString ?? ''}`.replace(/[^a-zA-Z0-9]/g, '');
  }
}
