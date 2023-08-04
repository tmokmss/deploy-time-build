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
   * If the project does not have a physical name, this string will be reflected its generated name. The combination of lambdaPurpose and uuid must be unique.
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
    const constructName = (props.projectPurpose ?? 'SingletonProject') + this.slugify(props.uuid);
    const existing = Stack.of(this).node.tryFindChild(constructName);
    if (existing) {
      return existing as Project;
    }

    return new Project(Stack.of(this), constructName, props);
  }

  private slugify(x: string): string {
    return x.replace(/[^a-zA-Z0-9]/g, '');
  }
}
