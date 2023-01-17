import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import extract from 'extract-zip';
import { execSync } from 'child_process';
import { Readable } from 'stream';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { ResourceProperties } from '../../src/types';

const s3 = new S3Client({});

type Event = {
  RequestType: 'Create' | 'Update' | 'Delete';
  ResponseURL: string;
  StackId: string;
  RequestId: string;
  ResourceType: string;
  LogicalResourceId: string;
  ResourceProperties: ResourceProperties;
};

export const handler = async (event: Event, context: any) => {
  let rootDir = '';
  console.log(JSON.stringify(event));

  try {
    if (event.RequestType == 'Create' || event.RequestType == 'Update') {
      const props = event.ResourceProperties;
      rootDir = fs.mkdtempSync('/tmp/extract');

      // set npm cache directory under /tmp since other directories are read-only in Lambda env
      process.env.NPM_CONFIG_CACHE = '/tmp/.npm';

      // inject environment variables from resource properties
      Object.entries(props.environment ?? {}).forEach(([key, value]) => (process.env[key] = value));

      // Download and extract each asset, and execute commands if any specified.
      const promises = props.sources.map(async (p) => {
        const dir = await extractZip(rootDir, p.directoryName, p.sourceObjectKey, p.sourceBucketName);
        if (p.commands != null) {
          execSync(p.commands.join(' && '), { cwd: dir, stdio: 'inherit' });
        }
      });

      await Promise.all(promises);

      console.log(JSON.stringify(process.env));
      const wd = path.join(rootDir, props.workingDirectory);
      execSync(props.buildCommands.join(' && '), {
        cwd: wd,
        stdio: 'inherit',
      });

      // zip the artifact directory and upload it to a S3 bucket.
      const srcPath = path.join(rootDir, props.outputSourceDirectory);
      await uploadDistDirectory(srcPath, props.destinationBucketName, props.destinationObjectKey);
    } else {
      // how do we process 'Delete' event?
    }
    await sendStatus('SUCCESS', event, context);
  } catch (e) {
    console.log(e);
    const err = e as Error;
    await sendStatus('FAILED', event, context, err.message);
  } finally {
    if (rootDir != '') {
      // remove the working directory to prevent storage leakage
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  }
};

const sendStatus = async (status: 'SUCCESS' | 'FAILED', event: Event, context: any, reason?: string) => {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: reason ?? 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
    Data: {}, //responseData
  });

  await fetch(event.ResponseURL, {
    method: 'PUT',
    body: responseBody,
    headers: {
      'Content-Type': '',
      'Content-Length': responseBody.length.toString(),
    },
  });
};

const uploadDistDirectory = async (srcPath: string, dstBucket: string, dstKey: string) => {
  const zip = new AdmZip();
  zip.addLocalFolder(srcPath);
  await s3.send(
    new PutObjectCommand({
      Body: zip.toBuffer(),
      Bucket: dstBucket,
      Key: dstKey,
    })
  );
};

const extractZip = async (rootDir: string, dirName: string, key: string, bucket: string) => {
  const dir = path.join(rootDir, dirName);
  fs.mkdirSync(dir, { recursive: true });
  const zipPath = path.join(dir, 'temp.zip');
  await downloadS3File(key, bucket, zipPath);
  await extract(zipPath, { dir });
  console.log(`extracted to ${dir}`);
  return dir;
};

const downloadS3File = async (key: string, bucket: string, dst: string) => {
  const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  await new Promise((resolve, reject) => {
    if (data.Body instanceof Readable) {
      data.Body
        .pipe(fs.createWriteStream(dst))
        .on('error', (err) => reject(err))
        .on('close', () => resolve(1));
    }
  });
};
