import type { ChildProcess } from 'node:child_process';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi
} from 'vitest';
import NotificationCenter from '../src/notifiers/notificationcenter.ts';
import Growl from '../src/notifiers/growl.ts';
import utils, { type CommandCallback } from '../src/lib/utils.ts';
import type {
  NotificationCenterNotification,
  NotificationMetadata
} from '../src/types.ts';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import * as testUtils from './_test-utils.ts';

type FileCommand = typeof utils.fileCommand;
type FileCommandArgs = Parameters<FileCommand>;

// Flags from older versions; nothing reads them anymore.
type LegacyFlags = { isNotifyChecked?: boolean; hasNotifier?: boolean };

let notifier: NotificationCenter;
const originalUtils = utils.fileCommand;
const originalMacVersion = utils.isMojaveOrLater;
const originalType = os.type;

describe('Mac fallback', function () {
  const original = utils.isMojaveOrLater;
  const originalMac = utils.isMac;

  afterEach(function () {
    utils.isMojaveOrLater = original;
    utils.isMac = originalMac;
  });

  it('should default to Growl notification if older macOS than 10.14', () =>
    new Promise<void>((done) => {
      utils.isMojaveOrLater = function () {
        return false;
      };
      utils.isMac = function () {
        return true;
      };
      const n = new NotificationCenter({ withFallback: true });
      n.notify(
        { message: 'Hello World' },
        function (this: unknown, _, response) {
          expect(this).toBeInstanceOf(Growl);
          done();
        }
      );
    }));

  it('should not fallback to Growl notification if withFallback is false', () =>
    new Promise<void>((done) => {
      utils.isMojaveOrLater = function () {
        return false;
      };
      utils.isMac = function () {
        return true;
      };
      const n = new NotificationCenter();
      n.notify(
        { message: 'Hello World' },
        function (this: unknown, err, response) {
          expect(err).toBeTruthy();
          expect(this).not.toBeInstanceOf(Growl);
          done();
        }
      );
    }));
});

describe('terminal-notifier', function () {
  beforeEach(function () {
    os.type = function () {
      return 'Darwin';
    };

    utils.isMojaveOrLater = function () {
      return true;
    };
  });

  beforeEach(function () {
    notifier = new NotificationCenter();
  });

  afterEach(function () {
    os.type = originalType;
    utils.isMojaveOrLater = originalMacVersion;
  });

  // Simulate async operation, move to end of message queue.
  function asyncify(fn: (...args: FileCommandArgs) => void): FileCommand {
    return function (...args: FileCommandArgs) {
      setTimeout(function () {
        fn(...args);
      }, 0);
    } as FileCommand;
  }

  describe('#notify()', function () {
    beforeEach(function () {
      utils.fileCommand = asyncify(function (_n, _o, cb) {
        cb(null, '');
      });
    });

    afterEach(function () {
      utils.fileCommand = originalUtils;
    });

    it('should notify with a message', () =>
      new Promise<void>((done) => {
        notifier.notify({ message: 'Hello World' }, function (err, response) {
          expect(err).toBeNull();
          done();
        });
      }));

    it('should be chainable', () =>
      new Promise<void>((done) => {
        notifier
          .notify({ message: 'First test' })
          .notify({ message: 'Second test' }, function (err, response) {
            expect(err).toBeNull();
            done();
          });
      }));

    it('should be able to list all notifications', () =>
      new Promise<void>((done) => {
        utils.fileCommand = asyncify(function (_n, _o, cb) {
          cb(
            null,
            fs
              .readFileSync(
                path.join(import.meta.dirname, '/fixture/listAll.txt')
              )
              .toString()
          );
        });

        notifier.notify({ list: 'ALL' }, function (_, response) {
          expect(response).toBeTruthy();
          done();
        });
      }));

    it('should be able to remove all messages', () =>
      new Promise<void>((done) => {
        utils.fileCommand = asyncify(function (_n, _o, cb) {
          cb(
            null,
            fs
              .readFileSync(
                path.join(import.meta.dirname, '/fixture/removeAll.txt')
              )
              .toString()
          );
        });

        notifier.notify({ remove: 'ALL' }, function (_, response) {
          expect(response).toBeTruthy();

          utils.fileCommand = asyncify(function (_n, _o, cb) {
            cb(null, '');
          });

          notifier.notify({ list: 'ALL' }, function (_, response) {
            expect(response).toBeFalsy();
            done();
          });
        });
      }));
  });

  describe('arguments', function () {
    let original: FileCommand;

    beforeEach(function () {
      original = utils.fileCommand;
    });

    afterEach(function () {
      utils.fileCommand = original;
    });

    function expectArgsListToBe(expected: string[], done: () => void) {
      utils.fileCommand = asyncify(function (notifier, argsList, callback) {
        expect(argsList).toEqual(expected);
        callback(undefined);
        done();
      });
    }

    it('should allow for non-sensical arguments (fail gracefully)', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"title"',
          '-message',
          '"body"',
          '-tullball',
          '"notValid"'
        ];

        expectArgsListToBe(expected, done);
        const notifier: NotificationCenter & LegacyFlags =
          new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title',
          message: 'body',
          tullball: 'notValid'
        } as NotificationCenterNotification);
      }));

    it('should validate and transform sound to default sound if Windows sound is selected', () =>
      new Promise<void>((done) => {
        utils.fileCommand = asyncify(function (notifier, argsList, callback) {
          expect(testUtils.getOptionValue(argsList, '-title')).toBe('"Heya"');
          expect(testUtils.getOptionValue(argsList, '-sound')).toBe('"Bottle"');
          callback(undefined);
          done();
        });
        const notifier = new NotificationCenter();
        notifier.notify({
          title: 'Heya',
          message: 'foo bar',
          sound: 'Notification.Default'
        });
      }));

    it('should pass each action unquoted as its own argument', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"title \\"message\\""',
          '-message',
          '"body \\"message\\""',
          '-timeout',
          '"10"',
          '-action',
          'foo',
          '-action',
          'bar',
          '-action',
          'baz "foo" bar'
        ];

        expectArgsListToBe(expected, done);
        const notifier: NotificationCenter & LegacyFlags =
          new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title "message"',
          message: 'body "message"',
          actions: ['foo', 'bar', 'baz "foo" bar']
        });
      }));

    it('should still support wait flag with default timeout', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"Title"',
          '-message',
          '"Message"',
          '-reply',
          '""',
          '-timeout',
          '"5"'
        ];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          title: 'Title',
          message: 'Message',
          reply: true,
          wait: true
        });
      }));

    it('should let timeout set precedence over wait', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"Title"',
          '-message',
          '"Message"',
          '-reply',
          '""',
          '-timeout',
          '"10"'
        ];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          title: 'Title',
          message: 'Message',
          reply: true,
          wait: true,
          timeout: 10
        });
      }));

    it('should not set a default timeout if explicitly false', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"Title"',
          '-message',
          '"Message"',
          '-action',
          'OK'
        ];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          title: 'Title',
          message: 'Message',
          actions: 'OK',
          timeout: false
        });
      }));

    it('should not pass a timeout without actions or reply', () =>
      new Promise<void>((done) => {
        const expected = ['-title', '"Title"', '-message', '"Message"'];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          title: 'Title',
          message: 'Message',
          wait: true,
          timeout: 30
        });
      }));

    it('should pass reply placeholder as is', () =>
      new Promise<void>((done) => {
        const expected = ['-message', '"Message"', '-reply', '"Say hi"'];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          message: 'Message',
          reply: 'Say hi',
          timeout: false
        });
      }));

    it('should drop options terminal-notifier no longer supports', () =>
      new Promise<void>((done) => {
        const expected = ['-message', '"Message"'];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.notify({
          message: 'Message',
          icon: '/tmp/icon.png',
          appIcon: '/tmp/icon.png',
          sender: 'com.apple.Terminal',
          closeLabel: 'Close',
          dropdownLabel: 'Choose'
        } as NotificationCenterNotification);
      }));

    it('should escape all title and message', () =>
      new Promise<void>((done) => {
        const expected = [
          '-title',
          '"title \\"message\\""',
          '-message',
          '"body \\"message\\""',
          '-tullball',
          '"notValid"'
        ];

        expectArgsListToBe(expected, done);
        const notifier: NotificationCenter & LegacyFlags =
          new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title "message"',
          message: 'body "message"',
          tullball: 'notValid'
        } as NotificationCenterNotification);
      }));
  });

  describe('responses', function () {
    afterEach(function () {
      utils.fileCommand = originalUtils;
    });

    interface Result {
      err: Error | null;
      response: string | undefined;
      metadata: NotificationMetadata | undefined;
      events: string[];
    }

    function respond(
      options: NotificationCenterNotification,
      err: Error | string,
      stdout: string
    ): Promise<Result> {
      utils.fileCommand = asyncify(function (_n, _o, cb) {
        cb(err, stdout);
      });
      const events: string[] = [];
      const notifier = new NotificationCenter();
      for (const event of ['click', 'timeout', 'replied']) {
        notifier.on(event, () => events.push(event));
      }
      return new Promise((resolve) => {
        notifier.notify(options, (err, response, metadata) =>
          resolve({ err, response, metadata, events })
        );
      });
    }

    it('should report the chosen action', async function () {
      const result = await respond(
        { message: 'Hi', actions: ['Yes', 'No'] },
        '',
        'No\n'
      );
      expect(result.err).toBeNull();
      expect(result.response).toBe('activate');
      expect(result.metadata).toEqual({
        activationType: 'actionClicked',
        activationValue: 'No'
      });
      expect(result.events).toEqual(['click']);
    });

    it('should report a click on the notification body', async function () {
      const result = await respond(
        { message: 'Hi', actions: ['Yes'] },
        '',
        '@ACTIONCLICKED\n'
      );
      expect(result.metadata).toEqual({ activationType: 'contentsClicked' });
      expect(result.events).toEqual(['click']);
    });

    it('should report a reply', async function () {
      const result = await respond(
        { message: 'Hi', reply: true },
        '',
        'Hello there\n'
      );
      expect(result.response).toBe('replied');
      expect(result.metadata).toEqual({
        activationType: 'replied',
        activationValue: 'Hello there'
      });
      expect(result.events).toEqual(['replied']);
    });

    it('should report a closed notification', async function () {
      const result = await respond(
        { message: 'Hi', reply: true },
        '',
        '@CLOSED\n'
      );
      expect(result.response).toBe('closed');
      expect(result.metadata).toEqual({ activationType: 'closed' });
      expect(result.events).toEqual([]);
    });

    it('should report a timeout without an error', async function () {
      const error = Object.assign(new Error('Command failed'), { code: 6 });
      const result = await respond(
        { message: 'Hi', actions: ['OK'], timeout: 1 },
        error,
        '@TIMEOUT\n'
      );
      expect(result.err).toBeNull();
      expect(result.response).toBe('timeout');
      expect(result.metadata).toEqual({ activationType: 'timeout' });
      expect(result.events).toEqual(['timeout']);
    });

    it('should reject action titles that look like flags', async function () {
      const spawned = vi.fn();
      utils.fileCommand = spawned;
      const result = await new Promise((resolve) =>
        new NotificationCenter().notify(
          { message: 'Hi', actions: ['OK', '-help'] },
          (err) => resolve(err)
        )
      );
      expect(result).toBeInstanceOf(Error);
      expect(spawned).not.toHaveBeenCalled();
    });

    it('should pass other failures as errors', async function () {
      const error = Object.assign(new Error('Command failed'), { code: 3 });
      const result = await respond({ message: 'Hi' }, error, '');
      expect(result.err).toBe(error);
    });

    it('should pass warnings from stderr along with the response', async function () {
      const result = await respond(
        { message: 'Hi', contentImage: 'https://example.com/a.png' },
        '[!] -contentImage only accepts local file paths.\n',
        ''
      );
      expect(result.err).toMatch(/contentImage/);
      expect(result.metadata).toEqual({});
    });
  });

  describe('#clearAll()', function () {
    interface FakeProcess {
      running: boolean;
      kill: Mock<() => void>;
      finish: (err?: Error | null, data?: string) => void;
    }

    let processes: FakeProcess[];

    // Fake child process that, like execFile, calls back asynchronously
    // with an error when killed.
    function fakeProcess(cb: CommandCallback): FakeProcess {
      const p: FakeProcess = {
        running: true,
        kill: vi.fn(function () {
          p.finish(
            Object.assign(new Error('Command failed'), {
              killed: true,
              signal: 'SIGTERM'
            })
          );
        }),
        finish: function (err, data) {
          if (!p.running) return;
          p.running = false;
          setTimeout(function () {
            cb(err || null, data || '');
          }, 0);
        }
      };
      return p;
    }

    beforeEach(function () {
      processes = [];
      utils.fileCommand = function (_n, _o, cb) {
        const p = fakeProcess(cb);
        processes.push(p);
        return p as unknown as ChildProcess;
      };
    });

    afterEach(function () {
      utils.fileCommand = originalUtils;
    });

    function tick() {
      return new Promise((resolve) => setTimeout(resolve, 5));
    }

    it('should kill all running terminal-notifier processes', function () {
      notifier.notify({ message: 'First' });
      notifier.notify({ message: 'Second' });
      notifier.clearAll();
      expect(processes.map((p) => p.kill.mock.calls.length)).toEqual([1, 1]);
    });

    it('should not kill finished processes', async function () {
      notifier.notify({ message: 'A' });
      notifier.notify({ message: 'B' });
      notifier.notify({ message: 'C' });
      processes[0]!.finish();
      await tick();
      processes[1]!.finish();
      await tick();

      notifier.clearAll();
      expect(processes.map((p) => p.kill.mock.calls.length)).toEqual([0, 0, 1]);
    });

    it('should call back without error for cleared notifications', async function () {
      const callback = vi.fn();
      const onTimeout = vi.fn();
      notifier.on('timeout', onTimeout);
      notifier.notify({ message: 'Hello World' }, callback);
      notifier.clearAll();
      await tick();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]![0]).toBeNull();
      expect(callback.mock.calls[0]![1]).toBeUndefined();
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should still pass errors from processes that were not cleared', async function () {
      const callback = vi.fn();
      notifier.notify({ message: 'Hello World' }, callback);
      const error = new Error('Command failed');
      processes[0]!.finish(error);
      await tick();
      expect(callback.mock.calls[0]![0]).toBe(error);
    });

    it('should track notifications sent right after clearing', async function () {
      notifier.notify({ message: 'Old' });
      notifier.clearAll();
      notifier.notify({ message: 'New' });
      await tick();

      notifier.clearAll();
      expect(processes[1]!.kill).toHaveBeenCalledTimes(1);
    });

    it('should only clear notifications from its own instance', function () {
      const other = new NotificationCenter();
      notifier.notify({ message: 'Mine' });
      other.notify({ message: 'Theirs' });
      notifier.clearAll();
      expect(processes[0]!.kill).toHaveBeenCalledTimes(1);
      expect(processes[1]!.kill).not.toHaveBeenCalled();
    });

    it('should do nothing without notifications', function () {
      expect(() => notifier.clearAll()).not.toThrow();
    });

    it('should stop a real waiting process', async function () {
      utils.fileCommand = originalUtils;
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'node-notifier-'));
      const script = path.join(dir, 'terminal-notifier');
      fs.writeFileSync(script, '#!/bin/sh\nexec sleep 30\n', { mode: 0o755 });

      try {
        const n = new NotificationCenter({ customPath: script });
        const started = Date.now();
        const result = new Promise((resolve) => {
          n.notify({ message: 'Hello World', timeout: 30 }, function (err) {
            resolve(err);
          });
        });
        n.clearAll();

        expect(await result).toBeNull();
        expect(Date.now() - started).toBeLessThan(5000);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
