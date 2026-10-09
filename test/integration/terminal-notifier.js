import { describe, expect, it, test } from 'vitest';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { NotificationCenter } from 'node-notifier';

function hasNotificationCenter() {
  try {
    execSync('pgrep -x NotificationCenter', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function notify(options) {
  return new Promise((resolve, reject) => {
    new NotificationCenter().notify(options, (err, response, metadata) =>
      err ? reject(err) : resolve({ response, metadata })
    );
  });
}

describe.runIf(os.type() === 'Darwin' && hasNotificationCenter())(
  'terminal-notifier (integration)',
  () => {
    it('sends a notification without waiting', async () => {
      const { metadata } = await notify({
        title: 'node-notifier',
        message: 'integration test',
        timeout: false
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
  }
);
