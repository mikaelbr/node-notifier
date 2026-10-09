import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Notify from '../notifiers/notifysend.js';
import utils from '../lib/utils.js';
import os from 'node:os';

describe('notify-send', function () {
  const original = utils.commandWithoutShell;
  const originalType = os.type;

  beforeEach(function () {
    os.type = function () {
      return 'Linux';
    };
  });

  afterEach(function () {
    utils.commandWithoutShell = original;
    os.type = originalType;
  });

  function expectArgsListToBe(expected, done) {
    utils.commandWithoutShell = function (notifier, argsList, callback) {
      expect(argsList).toEqual(expected);
      done();
    };
  }

  it('should pass on title and body', () =>
    new Promise((done) => {
      const expected = ['--expire-time', '10000', '--', 'title', 'body'];
      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ title: 'title', message: 'body' });
    }));

  it('should pass have default title', () =>
    new Promise((done) => {
      const expected = [
        '--expire-time',
        '10000',
        '--',
        'Node Notification:',
        'body'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ message: 'body' });
    }));

  it('should throw error if no message is passed', () =>
    new Promise((done) => {
      utils.commandWithoutShell = function (notifier, argsList, callback) {
        expect(argsList).toBeUndefined();
      };

      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({}, function (err) {
        expect(err.message).toBe('Message is required.');
        done();
      });
    }));

  it('should escape message input', () =>
    new Promise((done) => {
      const excapedNewline = process.platform === 'win32' ? '\\r\\n' : '\\n';
      const expected = [
        '--expire-time',
        '10000',
        '--',
        'Node Notification:',
        'some' + excapedNewline + ' "me\'ss`age`"'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ message: 'some\n "me\'ss`age`"' });
    }));

  it('should escape array items as normal items', () =>
    new Promise((done) => {
      const expected = [
        '--app-name',
        'foo`touch exploit`',
        '--category',
        'foo`touch exploit`',
        '--expire-time',
        '10000',
        '--',
        'Hacked',
        '`touch HACKED`'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      const options = JSON.parse(
        `{
        "title": "Hacked",
        "message":["\`touch HACKED\`"],
        "app-name": ["foo\`touch exploit\`"],
        "category": ["foo\`touch exploit\`"]
      }`
      );
      notifier.notify(options);
    }));

  it('should send additional parameters as --"keyname"', () =>
    new Promise((done) => {
      const expected = [
        '--icon',
        'icon-string',
        '--expire-time',
        '10000',
        '--',
        'title',
        'body'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ title: 'title', message: 'body', icon: 'icon-string' });
    }));

  it('should remove extra options that are not supported by notify-send', () =>
    new Promise((done) => {
      const expected = [
        '--icon',
        'icon-string',
        '--expire-time',
        '1000',
        '--',
        'title',
        'body'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({
        title: 'title',
        message: 'body',
        icon: 'icon-string',
        time: 1,
        tullball: 'notValid'
      });
    }));

  it('should pass values starting with a dash as positional arguments', () =>
    new Promise((done) => {
      const expected = [
        '--expire-time',
        '10000',
        '--',
        '--title',
        '-u critical'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ title: '--title', message: '-u critical' });
    }));

  it('should not fail on an option named hasOwnProperty', () =>
    new Promise((done) => {
      const expected = ['--expire-time', '10000', '--', 'title', 'body'];

      expectArgsListToBe(expected, done);
      const notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({ title: 'title', message: 'body', hasOwnProperty: 'x' });
    }));
});
