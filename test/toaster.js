const Notify = require('../notifiers/toaster');
const utils = require('../lib/utils');
const path = require('path');
const os = require('os');
const testUtils = require('./_test-utils');
jest.mock('crypto', () => {
  return { randomUUID: () => '123456789' };
});

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
  });

  afterEach(function () {
    utils.fileCommand = original;
    utils.createNamedPipe = createNamedPipe;
    os.type = originalType;
    os.arch = originalArch;
    os.release = originalRelease;
  });

  it('should only pass allowed options and proper named properties', function (done) {
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
  });

  it('should pass silent without parameters', function (done) {
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
  });

  it('should not have appId', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-appId')).toBeFalsy();
      done();
    };
    const notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar'
    });
  });

  it('should translate from notification centers appIcon', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-p')).toBeTruthy();
      done();
    };
    const notifier = new Notify();

    notifier.notify({
      message: 'Heya',
      appIcon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });

  it('should translate from remove to close', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-remove')).toBeFalsy();
      done();
    };
    const notifier = new Notify();

    notifier.notify({ message: 'Heya', remove: 3 });
  });

  it('should fail if neither close or message is defined', function (done) {
    const notifier = new Notify();

    notifier.notify({ title: 'Heya' }, function (err) {
      expect(err.message).toBe('Message or ID to close is required.');
      done();
    });
  });

  it('should pass only close', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
      callback();
    };
    const notifier = new Notify();

    notifier.notify({ close: 3 }, function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should pass only message', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
      callback();
    };
    const notifier = new Notify();

    notifier.notify({ message: 'Hello' }, function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should pass shorthand message', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
      callback();
    };
    const notifier = new Notify();

    notifier.notify('hello', function (err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should wrap message and title', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
      expect(testUtils.getOptionValue(argsList, '-m')).toBe('foo bar');
      done();
    };
    const notifier = new Notify();

    notifier.notify({ title: 'Heya', message: 'foo bar' });
  });

  it('should validate and transform sound to default sound if Mac sound is selected', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
      expect(testUtils.getOptionValue(argsList, '-s')).toBe(
        'Notification.Default'
      );
      done();
    };
    const notifier = new Notify();

    notifier.notify({ title: 'Heya', message: 'foo bar', sound: 'Frog' });
  });

  it('should use 32 bit snoreToaster if 32 arch', function (done) {
    os.arch = function () {
      return 'ia32';
    };
    const expected = 'snoretoast-x86.exe';
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(notifier).toEndWith(expected);
      done();
    };
    new Notify().notify({ title: 'title', message: 'body' });
  });

  it('should default to x64 version', function (done) {
    os.arch = function () {
      return 'x64';
    };
    const expected = 'snoretoast-x64.exe';
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(notifier).toEndWith(expected);
      done();
    };
    new Notify().notify({ title: 'title', message: 'body' });
  });

  it('sound as true should select default value', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-s')).toBe(
        'Notification.Default'
      );
      done();
    };
    const notifier = new Notify();

    notifier.notify({ message: 'foo bar', sound: true });
  });

  it('sound as false should be same as silent', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-silent')).toBeTruthy();
      done();
    };
    const notifier = new Notify();

    notifier.notify({ message: 'foo bar', sound: false });
  });

  it('should override sound', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-s')).toBe('Notification.IM');
      done();
    };
    const notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      sound: 'Notification.IM'
    });
  });

  it('should parse file protocol URL of icon', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(argsList[3]).toBe('C:\\node-notifier\\test\\fixture\\coulson.jpg');
      done();
    };

    const notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });

  it('should not parse local path of icon', function (done) {
    const icon = path.join(__dirname, 'fixture', 'coulson.jpg');
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(argsList[3]).toBe(icon);
      done();
    };

    const notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });

  it('should not parse normal URL of icon', function (done) {
    const icon = 'http://csscomb.com/img/csscomb.jpg';
    utils.fileCommand = function (notifier, argsList, callback) {
      expect(argsList[3]).toBe(icon);
      done();
    };

    const notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });

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

  it('should call custom notifier when customPath is passed via message', (done) => {
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
  });

  it('should call custom notifier when customPath is passed via constructor', (done) => {
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
  });
});
