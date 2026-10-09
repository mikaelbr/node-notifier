import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Notify from '../notifiers/toaster.js';
import utils from '../lib/utils.js';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import * as testUtils from './_test-utils.js';

describe('WindowsToaster', function () {
  const original = utils.fileCommand;
  const createNamedPipe = utils.createNamedPipe;
  const originalType = os.type;
  const originalArch = os.arch;
  const originalRelease = os.release;

  beforeEach(function () {
    os.release = function () {
      return '6.2.9200';
    };
    os.type = function () {
      return 'Windows_NT';
    };
    utils.createNamedPipe = () => Promise.resolve(Buffer.from('12345'));
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('123456789');
  });

  afterEach(function () {
    utils.fileCommand = original;
    utils.createNamedPipe = createNamedPipe;
    os.type = originalType;
    os.arch = originalArch;
    os.release = originalRelease;
    vi.restoreAllMocks();
  });

  it('should only pass allowed options and proper named properties', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-t')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-b')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-p')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-id')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-appID')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-pipeName')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-install')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();

        expect(testUtils.argsListHas(argsList, '-foo')).toBeFalsy();
        expect(testUtils.argsListHas(argsList, '-bar')).toBeFalsy();
        expect(testUtils.argsListHas(argsList, '-message')).toBeFalsy();
        expect(testUtils.argsListHas(argsList, '-title')).toBeFalsy();
        expect(testUtils.argsListHas(argsList, '-tb')).toBeFalsy();
        expect(testUtils.argsListHas(argsList, '-pid')).toBeFalsy();
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        extra: 'dsakdsa',
        foo: 'bar',
        close: 123,
        bar: true,
        install: '/dsa/',
        appID: 123,
        icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg',
        id: 1337,
        sound: 'Notification.IM',
        actions: ['Ok', 'Cancel']
      });
    }));

  it('should pass silent without parameters', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-silent')).not.toBe('true');
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        silent: true
      });
    }));

  it('should not have appId', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-appId')).toBeFalsy();
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar'
      });
    }));

  it('should pass application', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-application')).toBe(
          'C:\\path\\to\\app.exe'
        );
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        message: 'foo bar',
        appID: 'com.example.app',
        application: 'C:\\path\\to\\app.exe'
      });
    }));

  it('should drop application without a string value', async () => {
    for (const application of [true, false, '', 123, null, ['a.exe']]) {
      const argsList = await new Promise((resolve) => {
        utils.fileCommand = (notifier, argsList) => resolve(argsList);
        new Notify().notify({ message: 'foo bar', application });
      });
      expect(testUtils.argsListHas(argsList, '-application')).toBeFalsy();
    }
  });

  it('should error on application starting with "-"', () =>
    new Promise((done) => {
      utils.fileCommand = function () {
        throw new Error('should not be called');
      };
      const notifier = new Notify();

      notifier.notify(
        { message: 'foo bar', application: '-close' },
        function (err) {
          expect(err.message).toBe('Application can not start with "-".');
          done();
        }
      );
    }));

  it('should translate from notification centers appIcon', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-p')).toBeTruthy();
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        message: 'Heya',
        appIcon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
      });
    }));

  it('should translate from remove to close', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
        expect(testUtils.argsListHas(argsList, '-remove')).toBeFalsy();
        done();
      };
      const notifier = new Notify();

      notifier.notify({ message: 'Heya', remove: 3 });
    }));

  it('should fail if neither close or message is defined', () =>
    new Promise((done) => {
      const notifier = new Notify();

      notifier.notify({ title: 'Heya' }, function (err) {
        expect(err.message).toBe('Message or ID to close is required.');
        done();
      });
    }));

  it('should only call callback once with error if snoretoast fails', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        callback(Object.assign(new Error('failed'), { code: -1 }));
      };
      const notifier = new Notify();
      const calls = [];

      notifier.notify({ message: 'Heya' }, function (err) {
        calls.push(err);
      });

      setTimeout(() => {
        expect(calls).toHaveLength(1);
        expect(calls[0].message).toBe('failed');
        done();
      }, 10);
    }));

  it('should pass only close', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
        callback();
      };
      const notifier = new Notify();

      notifier.notify({ close: 3 }, function (err) {
        expect(err).toBeFalsy();
        done();
      });
    }));

  it('should pass only message', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
        callback();
      };
      const notifier = new Notify();

      notifier.notify({ message: 'Hello' }, function (err) {
        expect(err).toBeFalsy();
        done();
      });
    }));

  it('should pass shorthand message', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
        callback();
      };
      const notifier = new Notify();

      notifier.notify('hello', function (err) {
        expect(err).toBeFalsy();
        done();
      });
    }));

  it('should wrap message and title', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
        expect(testUtils.getOptionValue(argsList, '-m')).toBe('foo bar');
        done();
      };
      const notifier = new Notify();

      notifier.notify({ title: 'Heya', message: 'foo bar' });
    }));

  it('should validate and transform sound to default sound if Mac sound is selected', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
        expect(testUtils.getOptionValue(argsList, '-s')).toBe(
          'Notification.Default'
        );
        done();
      };
      const notifier = new Notify();

      notifier.notify({ title: 'Heya', message: 'foo bar', sound: 'Frog' });
    }));

  it('should use 32 bit snoreToaster if 32 arch', () =>
    new Promise((done) => {
      os.arch = function () {
        return 'ia32';
      };
      const expected = 'snoretoast-x86.exe';
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(notifier).toEndWith(expected);
        done();
      };
      new Notify().notify({ title: 'title', message: 'body' });
    }));

  it('should default to x64 version', () =>
    new Promise((done) => {
      os.arch = function () {
        return 'x64';
      };
      const expected = 'snoretoast-x64.exe';
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(notifier).toEndWith(expected);
        done();
      };
      new Notify().notify({ title: 'title', message: 'body' });
    }));

  describe('duration', function () {
    function argsFor(arch, options, constructorOptions) {
      os.arch = () => arch;
      return new Promise((resolve) => {
        utils.fileCommand = (notifier, argsList) => resolve(argsList);
        new Notify(constructorOptions).notify(options);
      });
    }

    it('should pass duration long as -d long on x64', async () => {
      const args = await argsFor('x64', { message: 'Hi', duration: 'long' });
      expect(testUtils.getOptionValue(args, '-d')).toBe('long');
    });

    it('should lowercase duration', async () => {
      const args = await argsFor('x64', { message: 'Hi', duration: 'SHORT' });
      expect(testUtils.getOptionValue(args, '-d')).toBe('short');
    });

    it('should not pass -d by default', async () => {
      const args = await argsFor('x64', { message: 'Hi' });
      expect(args).not.toContain('-d');
    });

    it('should drop invalid duration values', async () => {
      for (const duration of ['forever', 25, true, '-close', '']) {
        const args = await argsFor('x64', { message: 'Hi', duration });
        expect(args).not.toContain('-d');
      }
    });

    it('should drop raw d option', async () => {
      for (const d of ['-close', 'long', 'foo']) {
        const args = await argsFor('x64', { message: 'Hi', d });
        expect(args).not.toContain('-d');
      }
    });

    it('should drop duration with bundled x86 binary', async () => {
      for (const arch of ['ia32', 'arm64']) {
        const args = await argsFor(arch, { message: 'Hi', duration: 'long' });
        expect(args).not.toContain('-d');
      }
    });

    it('should keep duration on non-x64 with customPath', async () => {
      const perCall = await argsFor('arm64', {
        message: 'Hi',
        duration: 'long',
        customPath: '/test/customPath/snoretoast.exe'
      });
      expect(testUtils.getOptionValue(perCall, '-d')).toBe('long');

      const instance = await argsFor(
        'ia32',
        { message: 'Hi', duration: 'long' },
        { customPath: '/test/customPath/snoretoast.exe' }
      );
      expect(testUtils.getOptionValue(instance, '-d')).toBe('long');
    });
  });

  it('sound as true should select default value', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-s')).toBe(
          'Notification.Default'
        );
        done();
      };
      const notifier = new Notify();

      notifier.notify({ message: 'foo bar', sound: true });
    }));

  it('sound as false should be same as silent', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.argsListHas(argsList, '-silent')).toBeTruthy();
        done();
      };
      const notifier = new Notify();

      notifier.notify({ message: 'foo bar', sound: false });
    }));

  it('should override sound', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-s')).toBe(
          'Notification.IM'
        );
        done();
      };
      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        sound: 'Notification.IM'
      });
    }));

  it('should parse file protocol URL of icon', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(argsList[3]).toBe(
          'C:\\node-notifier\\test\\fixture\\coulson.jpg'
        );
        done();
      };

      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
      });
    }));

  it('should not parse local path of icon', () =>
    new Promise((done) => {
      const icon = path.join(import.meta.dirname, 'fixture', 'coulson.jpg');
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(argsList[3]).toBe(icon);
        done();
      };

      const notifier = new Notify();
      notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
    }));

  it('should not parse normal URL of icon', () =>
    new Promise((done) => {
      const icon = 'http://csscomb.com/img/csscomb.jpg';
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(argsList[3]).toBe(icon);
        done();
      };

      const notifier = new Notify();
      notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
    }));

  it('should build command-line argument for actions array properly', () => {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(argsList).toEqual([
        '-close',
        '123',
        '-install',
        '/dsa/',
        '-id',
        '1337',
        '-pipeName',
        '\\\\.\\pipe\\notifierPipe-123456789',
        '-p',
        'C:\\node-notifier\\test\\fixture\\coulson.jpg',
        '-m',
        'foo bar',
        '-t',
        'Heya',
        '-s',
        'Notification.IM',
        '-b',
        'Ok;Cancel'
      ]);
    };
    const notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      extra: 'dsakdsa',
      foo: 'bar',
      close: 123,
      bar: true,
      install: '/dsa/',
      icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg',
      id: 1337,
      sound: 'Notification.IM',
      actions: ['Ok', 'Cancel']
    });
  });

  it('should call custom notifier when customPath is passed via message', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(notifier).toEqual('/test/customPath/snoretoast-x64.exe');
        done();
      };

      const notifier = new Notify();

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        extra: 'dsakdsa',
        foo: 'bar',
        close: 123,
        bar: true,
        id: 1337,
        sound: 'Notification.IM',
        customPath: '/test/customPath/snoretoast-x64.exe',
        actions: ['Ok', 'Cancel']
      });
    }));

  it('should call custom notifier when customPath is passed via constructor', () =>
    new Promise((done) => {
      utils.fileCommand = function (notifier, argsList, callback) {
        expect(notifier).toEqual('/test/customPath/snoretoast-x64.exe');
        done();
      };

      const notifier = new Notify({
        customPath: '/test/customPath/snoretoast-x64.exe'
      });

      notifier.notify({
        title: 'Heya',
        message: 'foo bar',
        extra: 'dsakdsa',
        foo: 'bar',
        close: 123,
        bar: true,
        id: 1337,
        sound: 'Notification.IM',
        actions: ['Ok', 'Cancel']
      });
    }));
});
