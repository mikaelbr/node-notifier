// Requires notify-send, a running dunst daemon and a D-Bus session, e.g.:
//   xvfb-run -a dbus-run-session -- sh -c 'dunst & sleep 1; pnpm test:integration'
import { describe, expect, it } from 'vitest';
import cp from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NotifySend } from 'node-notifier';

function notify(options) {
  return new Promise((resolve, reject) => {
    new NotifySend().notify(options, (err, response) =>
      err ? reject(err) : resolve(response)
    );
  });
}

// Dunst only moves notifications into its history once they are closed.
function dunstHistory() {
  cp.execFileSync('dunstctl', ['close-all']);
  const out = cp.execFileSync('dunstctl', ['history'], { encoding: 'utf8' });
  return JSON.parse(out).data[0].map((n) => ({
    summary: n.summary.data,
    body: n.body.data
  }));
}

describe.runIf(os.type() === 'Linux')('notify-send (integration)', () => {
  it('delivers title and message to the notification daemon', async () => {
    const message = `hello ${crypto.randomUUID()}`;
    await notify({ title: 'node-notifier', message });

    expect(dunstHistory()).toContainEqual({
      summary: 'node-notifier',
      body: message
    });
  });

  it('passes shell syntax and leading dashes through verbatim', async () => {
    const marker = path.join(os.tmpdir(), `notifier-${crypto.randomUUID()}`);
    const message = `$(touch ${marker}) \`touch ${marker}\``;
    await notify({ title: '-u critical', message });

    expect(fs.existsSync(marker)).toBe(false);
    expect(dunstHistory()).toContainEqual({
      summary: '-u critical',
      body: message
    });
  });
});
