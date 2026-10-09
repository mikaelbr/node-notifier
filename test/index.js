import os from 'node:os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import notifier from '../index.js';

describe('constructors', function () {
  it('should expose a default selected instance', function () {
    expect(notifier.notify).toBeTruthy();
  });

  it('should expect only a function callback as second parameter', function () {
    function cb() {}
    expect(notifier.notify({ title: 'My notification' }, cb)).toBeTruthy();
  });

  it('should throw error when second parameter is not a function', function () {
    const wrongParamOne = 200;
    const wrongParamTwo = 'meaningless string';
    const data = { title: 'My notification' };

    const base = notifier.notify.bind(notifier, data);
    expect(base.bind(notifier, wrongParamOne)).toThrowError(
      /^The second argument/
    );
    expect(base.bind(notifier, wrongParamTwo)).toThrowError(
      /^The second argument/
    );
  });

  it('should expose a default selected constructor function', function () {
    expect(notifier).toBeInstanceOf(notifier.Notification);
  });

  it('should expose constructor for WindowsBalloon', function () {
    expect(notifier.WindowsBalloon).toBeTruthy();
  });

  it('should expose constructor for WindowsToaster', function () {
    expect(notifier.WindowsToaster).toBeTruthy();
  });

  it('should expose constructor for NotifySend', function () {
    expect(notifier.NotifySend).toBeTruthy();
  });

  it('should expose constructor for Growl', function () {
    expect(notifier.Growl).toBeTruthy();
  });
});

describe('notifier selection', function () {
  const originalType = os.type;

  // Re-imports index.js so `selectNotifier()` runs again for the given platform.
  async function importWith({ wsl, type, env }) {
    vi.resetModules();
    vi.doMock('../lib/utils.js', async function (importOriginal) {
      const { default: utils } = await importOriginal();
      return {
        default: { ...utils, isWSL: () => wsl, isLessThanWin8: () => false }
      };
    });
    os.type = () => type;
    vi.stubEnv('NODE_NOTIFIER_WSL_NOTIFIER', env);
    return import('../index.js');
  }

  afterEach(function () {
    os.type = originalType;
    vi.doUnmock('../lib/utils.js');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('should use WindowsToaster under WSL by default', async function () {
    const mod = await importWith({ wsl: true, type: 'Linux' });
    expect(mod.Notification).toBe(mod.WindowsToaster);
  });

  it('should use NotifySend under WSL with NODE_NOTIFIER_WSL_NOTIFIER=linux', async function () {
    const mod = await importWith({ wsl: true, type: 'Linux', env: 'linux' });
    expect(mod.Notification).toBe(mod.NotifySend);
    expect(mod.default).toBeInstanceOf(mod.NotifySend);
  });

  it('should ignore other NODE_NOTIFIER_WSL_NOTIFIER values under WSL', async function () {
    for (const env of ['Linux', 'LINUX', '1', 'true', ' linux', '']) {
      const mod = await importWith({ wsl: true, type: 'Linux', env });
      expect(mod.Notification).toBe(mod.WindowsToaster);
    }
  });

  it('should not let NODE_NOTIFIER_WSL_NOTIFIER affect native Windows', async function () {
    const mod = await importWith({
      wsl: false,
      type: 'Windows_NT',
      env: 'linux'
    });
    expect(mod.Notification).toBe(mod.WindowsToaster);
  });

  it('should not let NODE_NOTIFIER_WSL_NOTIFIER affect macOS', async function () {
    const mod = await importWith({ wsl: false, type: 'Darwin', env: 'linux' });
    expect(mod.Notification).toBe(mod.NotificationCenter);
  });
});
