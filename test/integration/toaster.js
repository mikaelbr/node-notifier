import { describe, expect, it } from 'vitest';
import os from 'node:os';
import { WindowsToaster } from 'node-notifier';

describe.runIf(os.type() === 'Windows_NT')('snoretoast (integration)', () => {
  it('shows a toast and reports the result over the named pipe', async () => {
    const calls = [];
    await new Promise((resolve) => {
      new WindowsToaster().notify(
        { title: 'node-notifier', message: 'integration test', silent: true },
        (err, response, metadata) => {
          calls.push({ err, response, metadata });
          setTimeout(resolve, 500); // catch a second callback, if any
        }
      );
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].err).toBeNull();
    console.info('snoretoast result:', calls[0].response, calls[0].metadata);
  });
});
