var Notify = require('../notifiers/toaster');
var utils = require('../lib/utils');
var path = require('path');
var os = require('os');
var testUtils = require('./_test-utils');

describe('WindowsToaster', function() {
  beforeEach(function() {
    this.original = utils.fileCommand;
    this.originalType = os.type;
    this.originalArch = os.arch;
    this.originalRelease = os.release;
    os.release = function() {
      return '6.2.9200';
    };
    os.type = function() {
      return 'Windows_NT';
    };
  });

  afterEach(function() {
    utils.fileCommand = this.original;
    os.type = this.originalType;
    os.arch = this.originalArch;
    os.release = this.originalRelease;
  });

  it('should only pass allowed options and proper named properties', function(
    done
  ) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-t')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-w')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-p')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-id')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-appID')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-install')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();

      expect(testUtils.argsListHas(argsList, '-foo')).toBeFalsy();
      expect(testUtils.argsListHas(argsList, '-bar')).toBeFalsy();
      expect(testUtils.argsListHas(argsList, '-message')).toBeFalsy();
      expect(testUtils.argsListHas(argsList, '-title')).toBeFalsy();
      done();
    };
    var notifier = new Notify();

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
      wait: true
    });
  });

  it('should pass wait and silent without parameters', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-w')).not.toBe('true');
      expect(testUtils.getOptionValue(argsList, '-silent')).not.toBe('true');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      wait: true,
      silent: true
    });
  });

  it('should default to empty app name', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-appID')).toBe(' ');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar'
    });
  });

  it('should translate from notification centers appIcon', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-p')).toBeTruthy();
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      message: 'Heya',
      appIcon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });

  it('should translate from remove to close', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
      expect(testUtils.argsListHas(argsList, '-remove')).toBeFalsy();
      done();
    };
    var notifier = new Notify();

    notifier.notify({ message: 'Heya', remove: 3 });
  });

  it('should fail if neither close or message is defined', function(done) {
    var notifier = new Notify();

    notifier.notify({ title: 'Heya' }, function(err) {
      expect(err.message).toBe('Message or ID to close is required.');
      done();
    });
  });

  it('should pass only close', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-close')).toBeTruthy();
      callback();
    };
    var notifier = new Notify();

    notifier.notify({ close: 3 }, function(err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should pass only message', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
      callback();
    };
    var notifier = new Notify();

    notifier.notify({ message: 'Hello' }, function(err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should pass shorthand message', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-m')).toBeTruthy();
      callback();
    };
    var notifier = new Notify();

    notifier.notify('hello', function(err) {
      expect(err).toBeFalsy();
      done();
    });
  });

  it('should wrap message and title', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
      expect(testUtils.getOptionValue(argsList, '-m')).toBe('foo bar');
      done();
    };
    var notifier = new Notify();

    notifier.notify({ title: 'Heya', message: 'foo bar' });
  });

  it(
    'should validate and transform sound to default sound if Mac sound is selected',
    function(done) {
      utils.fileCommand = function(notifier, argsList, callback) {
        expect(testUtils.getOptionValue(argsList, '-t')).toBe('Heya');
        expect(
          testUtils.getOptionValue(argsList, '-s')
        ).toBe('Notification.Default');
        done();
      };
      var notifier = new Notify();

      notifier.notify({ title: 'Heya', message: 'foo bar', sound: 'Frog' });
    }
  );

  it('sound as true should select default value', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(
        testUtils.getOptionValue(argsList, '-s')
      ).toBe('Notification.Default');
      done();
    };
    var notifier = new Notify();

    notifier.notify({ message: 'foo bar', sound: true });
  });

  it('sound as false should be same as silent', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.argsListHas(argsList, '-silent')).toBeTruthy();
      done();
    };
    var notifier = new Notify();

    notifier.notify({ message: 'foo bar', sound: false });
  });

  it('should override sound', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(testUtils.getOptionValue(argsList, '-s')).toBe('Notification.IM');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      sound: 'Notification.IM'
    });
  });

  it('should parse file protocol URL of icon', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(argsList[1]).toBe('C:\\node-notifier\\test\\fixture\\coulson.jpg');
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });

  it('should not parse local path of icon', function(done) {
    var icon = path.join(__dirname, 'fixture', 'coulson.jpg');
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(argsList[1]).toBe(icon);
      done();
    };

    var notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });

  it('should not parse normal URL of icon', function(done) {
    var icon = 'http://csscomb.com/img/csscomb.jpg';
    utils.fileCommand = function(notifier, argsList, callback) {
      expect(argsList[1]).toBe(icon);
      done();
    };

    var notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });
});
