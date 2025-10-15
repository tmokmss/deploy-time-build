import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { NodejsBuild } from '../src';

// Mock Asset to avoid heavy file system operations
jest.mock('aws-cdk-lib/aws-s3-assets', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-s3-assets');
  return {
    ...actual,
    Asset: jest.fn().mockImplementation((_scope, _id, _props) => {
      const mockAsset = {
        s3BucketName: 'mock-bucket',
        s3ObjectKey: 'mock-key.zip',
        isZipArchive: true,
        bucket: {
          bucketName: 'mock-bucket',
          bucketArn: 'arn:aws:s3:::mock-bucket',
          s3UrlForObject: (obj: string) => `s3://mock-bucket/${obj}`,
          grantWrite: jest.fn(),
        },
        grantRead: jest.fn(),
        addResourceMetadata: jest.fn(),
        node: {
          defaultChild: {},
        },
      };
      return mockAsset;
    }),
  };
});

describe('NodejsBuild', () => {
  let app: App;
  let stack: Stack;
  let destinationBucket: Bucket;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    destinationBucket = new Bucket(stack, 'DestinationBucket');
    // Clear mock calls before each test
    (Asset as unknown as jest.Mock).mockClear();
  });

  describe('workingDirectory property', () => {
    test('uses first asset extractPath as default when workingDirectory is not specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'test-asset',
            extractPath: 'my-app',
          },
        ],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      // Check that CustomResource has correct properties
      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        workingDirectory: 'my-app',
        outputSourceDirectory: 'my-app/dist',
      });
    });

    test('uses first asset path basename as default when extractPath is not specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'test-asset',
          },
        ],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        workingDirectory: 'test-asset',
        outputSourceDirectory: 'test-asset/dist',
      });
    });

    test('uses specified workingDirectory when provided', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'test-asset',
            extractPath: 'my-app',
          },
        ],
        destinationBucket,
        workingDirectory: 'my-app/packages/frontend',
        outputSourceDirectory: 'build',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        workingDirectory: 'my-app/packages/frontend',
        outputSourceDirectory: 'my-app/packages/frontend/build',
      });
    });

    test('workingDirectory different from extractPath', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'test-asset',
            extractPath: 'app1',
          },
          {
            path: 'test-asset2',
            extractPath: 'app2',
          },
        ],
        destinationBucket,
        workingDirectory: 'app2',
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        workingDirectory: 'app2',
        outputSourceDirectory: 'app2/dist',
      });
    });
  });

  describe('other properties', () => {
    test('sets default buildCommands when not specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        buildCommands: ['npm run build'],
      });
    });

    test('uses custom buildCommands when specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        buildCommands: ['npm ci', 'npm run build:prod'],
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        buildCommands: ['npm ci', 'npm run build:prod'],
      });
    });

    test('sets buildEnvironment when specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        buildEnvironment: {
          NODE_ENV: 'production',
          API_URL: 'https://api.example.com',
        },
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        environment: {
          NODE_ENV: 'production',
          API_URL: 'https://api.example.com',
        },
      });
    });

    test('sets destinationKeyPrefix when specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        destinationKeyPrefix: 'my-prefix/',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        destinationKeyPrefix: 'my-prefix/',
      });
    });

    test('uses default "/" destinationKeyPrefix when not specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        destinationKeyPrefix: '/',
      });
    });

    test('includes distributionId when distribution is specified', () => {
      const distribution = Distribution.fromDistributionAttributes(stack, 'Distribution', {
        distributionId: 'E1234567890ABC',
        domainName: 'example.cloudfront.net',
      });

      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        distribution,
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        distributionId: 'E1234567890ABC',
      });
    });

    test('sets outputEnvFile to false by default', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        outputEnvFile: false,
      });
    });

    test('sets outputEnvFile to true when specified', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        outputEnvFile: true,
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        outputEnvFile: true,
      });
    });
  });

  describe('assets configuration', () => {
    test('handles single asset with commands', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'test-asset',
            extractPath: 'app',
            commands: ['npm install', 'npm run setup'],
          },
        ],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        sources: [
          {
            extractPath: 'app',
            commands: ['npm install', 'npm run setup'],
          },
        ],
      });
    });

    test('handles multiple assets', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [
          {
            path: 'app1',
            extractPath: 'frontend',
          },
          {
            path: 'app2',
            extractPath: 'backend',
            commands: ['npm install'],
          },
        ],
        destinationBucket,
        workingDirectory: 'frontend',
        outputSourceDirectory: 'build',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('Custom::CDKNodejsBuild', {
        sources: [
          {
            extractPath: 'frontend',
          },
          {
            extractPath: 'backend',
            commands: ['npm install'],
          },
        ],
      });
    });
  });

  describe('CodeBuild project', () => {
    test('creates CodeBuild project with correct runtime', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        nodejsVersion: 20,
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Image: 'aws/codebuild/standard:7.0',
        },
      });
    });

    test('creates SingletonFunction for custom resource handler', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });
  });

  describe('IAM permissions', () => {
    test('grants CodeBuild read permissions to assets', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      // CodeBuild should have permissions to read from asset bucket
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*', 's3:List*']),
              Effect: 'Allow',
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('grants CodeBuild write permissions to destination bucket', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      // CodeBuild should have read/write permissions to destination bucket
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
              ]),
              Effect: 'Allow',
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('grants CloudFront permissions when distribution is specified', () => {
      const distribution = Distribution.fromDistributionAttributes(stack, 'Distribution', {
        distributionId: 'E1234567890ABC',
        domainName: 'example.cloudfront.net',
      });

      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
        distribution,
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
              Effect: 'Allow',
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });

    test('grants Lambda permission to start CodeBuild', () => {
      new NodejsBuild(stack, 'NodejsBuild', {
        assets: [{ path: 'test-asset' }],
        destinationBucket,
        outputSourceDirectory: 'dist',
      });

      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: 'codebuild:StartBuild',
              Effect: 'Allow',
            },
          ],
        },
      });
    });
  });
});
