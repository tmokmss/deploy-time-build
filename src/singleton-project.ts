import { Stack } from 'aws-cdk-lib';
import { Project, ProjectProps } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export interface SingletonProjectProps extends ProjectProps {
  readonly uuid: string;
  readonly projectPurpose: string;
}

export class SingletonProject extends Construct {
  public readonly project: Project;

  constructor(scope: Construct, id: string, props: SingletonProjectProps) {
    super(scope, id);
    this.project = this.ensureProject(props);
  }

  private ensureProject(props: SingletonProjectProps): Project {
    const constructName = props.projectPurpose + this.slugify(props.uuid);
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
