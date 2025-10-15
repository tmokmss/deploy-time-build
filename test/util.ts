import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * integ-test runs update stack with the latest template, but
 * it does not trigger custom resource handler when there is
 * no change on custom resource properties.
 *
 * To enforce re-running the handler, we include the hash of
 * custom resource handler code in the properties.
 */
export const getCrHandlerHash = () => {
  const handlerFile = readFileSync(join('..', 'lambda', 'trigger-codebuild', 'dist', 'index.js')).toString();
  return createHash('md5').update(handlerFile).digest('hex');
};
