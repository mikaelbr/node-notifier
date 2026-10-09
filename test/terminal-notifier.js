import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationCenter from '../notifiers/notificationcenter.js';
import Growl from '../notifiers/growl.js';
import utils from '../lib/utils.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import * as testUtils from './_test-utils.js';

let notifier = null;
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
    new Promise((done) => {
      utils.isMojaveOrLater = function () {
        return false;
      };
      utils.isMac = function () {
        return true;
      };
      const n = new NotificationCenter({ withFallback: true });
      n.notify({ message: 'Hello World' }, function (_, response) {
        expect(this).toBeInstanceOf(Growl);
        done();
      });
    }));

  it('should not fallback to Growl notification if withFallback is false', () =>
    new Promise((done) => {
      utils.isMojaveOrLater = function () {
        return false;
      };
      utils.isMac = function () {
        return true;
      };
      const n = new NotificationCenter();
      n.notify({ message: 'Hello World' }, function (err, response) {
        expect(err).toBeTruthy();
        expect(this).not.toBeInstanceOf(Growl);
        done();
      });
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
  function asyncify(fn) {
    return function () {
      const args = arguments;
      setTimeout(function () {
        fn.apply(null, args);
      }, 0);
    };
  }

  describe('#notify()', function () {
    beforeEach(function () {
      utils.fileCommand = asyncify(function (n, o, cb) {
        cb(null, '');
      });
    });

    afterEach(function () {
      utils.fileCommand = originalUtils;
    });

    it('should notify with a message', () =>
      new Promise((done) => {
        notifier.notify({ message: 'Hello World' }, function (err, response) {
          expect(err).toBeNull();
          done();
        });
      }));

    it('should be chainable', () =>
      new Promise((done) => {
        notifier
          .notify({ message: 'First test' })
          .notify({ message: 'Second test' }, function (err, response) {
            expect(err).toBeNull();
            done();
          });
      }));

    it('should be able to list all notifications', () =>
      new Promise((done) => {
        utils.fileCommand = asyncify(function (n, o, cb) {
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
      new Promise((done) => {
        utils.fileCommand = asyncify(function (n, o, cb) {
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

          utils.fileCommand = asyncify(function (n, o, cb) {
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
    let original;

    beforeEach(function () {
      original = utils.fileCommand;
    });

    afterEach(function () {
      utils.fileCommand = original;
    });

    function expectArgsListToBe(expected, done) {
      utils.fileCommand = asyncify(function (notifier, argsList, callback) {
        expect(argsList).toEqual(expected);
        callback();
        done();
      });
    }

    it('should allow for non-sensical arguments (fail gracefully)', () =>
      new Promise((done) => {
        const expected = [
          '-title',
          '"title"',
          '-message',
          '"body"',
          '-tullball',
          '"notValid"'
        ];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title',
          message: 'body',
          tullball: 'notValid'
        });
      }));

    it('should validate and transform sound to default sound if Windows sound is selected', () =>
      new Promise((done) => {
        utils.fileCommand = asyncify(function (notifier, argsList, callback) {
          expect(testUtils.getOptionValue(argsList, '-title')).toBe('"Heya"');
          expect(testUtils.getOptionValue(argsList, '-sound')).toBe('"Bottle"');
          callback();
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
      new Promise((done) => {
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
        const notifier = new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title "message"',
          message: 'body "message"',
          actions: ['foo', 'bar', 'baz "foo" bar']
        });
      }));

    it('should still support wait flag with default timeout', () =>
      new Promise((done) => {
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
      new Promise((done) => {
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
      new Promise((done) => {
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
      new Promise((done) => {
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
      new Promise((done) => {
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
      new Promise((done) => {
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
        });
      }));

    it('should escape all title and message', () =>
      new Promise((done) => {
        const expected = [
          '-title',
          '"title \\"message\\""',
          '-message',
          '"body \\"message\\""',
          '-tullball',
          '"notValid"'
        ];

        expectArgsListToBe(expected, done);
        const notifier = new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title "message"',
          message: 'body "message"',
          tullball: 'notValid'
        });
      }));
  });

  describe('responses', function () {
    afterEach(function () {
      utils.fileCommand = originalUtils;
    });

    function respond(options, err, stdout) {
      utils.fileCommand = asyncify(function (n, o, cb) {
        cb(err, stdout);
      });
      const events = [];
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
    let processes;

    // Fake child process that, like execFile, calls back asynchronously
    // with an error when killed.
    function fakeProcess(cb) {
      const p = {
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
      utils.fileCommand = function (n, o, cb) {
        const p = fakeProcess(cb);
        processes.push(p);
        return p;
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
      processes[0].finish();
      await tick();
      processes[1].finish();
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
      expect(callback.mock.calls[0][0]).toBeNull();
      expect(callback.mock.calls[0][1]).toBeUndefined();
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should still pass errors from processes that were not cleared', async function () {
      const callback = vi.fn();
      notifier.notify({ message: 'Hello World' }, callback);
      const error = new Error('Command failed');
      processes[0].finish(error);
      await tick();
      expect(callback.mock.calls[0][0]).toBe(error);
    });

    it('should track notifications sent right after clearing', async function () {
      notifier.notify({ message: 'Old' });
      notifier.clearAll();
      notifier.notify({ message: 'New' });
      await tick();

      notifier.clearAll();
      expect(processes[1].kill).toHaveBeenCalledTimes(1);
    });

    it('should only clear notifications from its own instance', function () {
      const other = new NotificationCenter();
      notifier.notify({ message: 'Mine' });
      other.notify({ message: 'Theirs' });
      notifier.clearAll();
      expect(processes[0].kill).toHaveBeenCalledTimes(1);
      expect(processes[1].kill).not.toHaveBeenCalled();
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
