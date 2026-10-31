import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import {
  NotificationCenter,
  type NotificationCenterNotification,
  type NotificationMetadata
} from '../../src/index.ts';

const binary = path.join(
  import.meta.dirname,
  '../../vendor/mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier'
);

function hasNotificationCenter() {
  try {
    execSync('pgrep -x NotificationCenter', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// terminal-notifier needs notification permission, which can't be granted
// without a person, e.g. on CI runners. `-diagnose` exits non-zero without it.
function isAuthorized() {
  try {
    execFileSync(binary, ['-diagnose'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function notify(options: NotificationCenterNotification) {
  return new Promise<{
    response: string | undefined;
    metadata: NotificationMetadata | undefined;
  }>((resolve, reject) => {
    new NotificationCenter().notify(options, (err, response, metadata) =>
      err ? reject(err) : resolve({ response, metadata })
    );
  });
}

const isMac = os.type() === 'Darwin' && hasNotificationCenter();
const authorized = isMac && isAuthorized();

describe.runIf(isMac && authorized)('terminal-notifier (integration)', () => {
  it('sends a notification without waiting', async () => {
    const { metadata } = await notify({
      title: 'node-notifier',
      message: 'integration test'
    });
    expect(metadata).toEqual({});
  });

  it('reports a timeout when nobody responds to an action', async () => {
    const { response, metadata } = await notify({
      title: 'node-notifier',
      message: 'integration test (timeout)',
      actions: ['OK'],
      timeout: 1
    });
    expect(response).toBe('timeout');
    expect(metadata).toEqual({ activationType: 'timeout' });
  });
});

describe.runIf(isMac && !authorized)(
  'terminal-notifier without permission (integration)',
  () => {
    it('reports that notifications are not allowed', async () => {
      await expect(
        notify({ title: 'node-notifier', message: 'integration test' })
      ).rejects.toMatchObject({ code: 3 });
    });
  }
);
