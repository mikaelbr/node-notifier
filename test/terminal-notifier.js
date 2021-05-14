const NotificationCenter = require('../notifiers/notificationcenter');
const Growl = require('../notifiers/growl');
const utils = require('../lib/utils');
const path = require('path');
const os = require('os');
const fs = require('fs');
const testUtils = require('./_test-utils');

let notifier = null;
const originalUtils = utils.fileCommandJson;
const originalMacVersion = utils.isMountainLion;
const originalType = os.type;

describe('Mac fallback', function () {
  const original = utils.isMountainLion;
  const originalMac = utils.isMac;

  afterEach(function () {
    utils.isMountainLion = original;
    utils.isMac = originalMac;
  });

  it('should default to Growl notification if older Mac OSX than 10.8', function (done) {
    utils.isMountainLion = function () {
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
  });

  it('should not fallback to Growl notification if withFallback is false', function (done) {
    utils.isMountainLion = function () {
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
  });
});

describe('terminal-notifier', function () {
  beforeEach(function () {
    os.type = function () {
      return 'Darwin';
    };

    utils.isMountainLion = function () {
      return true;
    };
  });

  beforeEach(function () {
    notifier = new NotificationCenter();
  });

  afterEach(function () {
    os.type = originalType;
    utils.isMountainLion = originalMacVersion;
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
      utils.fileCommandJson = asyncify(function (n, o, cb) {
        cb(null, '');
      });
    });

    afterEach(function () {
      utils.fileCommandJson = originalUtils;
    });

    it('should notify with a message', function (done) {
      notifier.notify({ message: 'Hello World' }, function (err, response) {
        expect(err).toBeNull();
        done();
      });
    });

    it('should be chainable', function (done) {
      notifier
        .notify({ message: 'First test' })
        .notify({ message: 'Second test' }, function (err, response) {
          expect(err).toBeNull();
          done();
        });
    });

    it('should be able to list all notifications', function (done) {
      utils.fileCommandJson = asyncify(function (n, o, cb) {
        cb(
          null,
          fs
            .readFileSync(path.join(__dirname, '/fixture/listAll.txt'))
            .toString()
        );
      });

      notifier.notify({ list: 'ALL' }, function (_, response) {
        expect(response).toBeTruthy();
        done();
      });
    });

    it('should be able to remove all messages', function (done) {
      utils.fileCommandJson = asyncify(function (n, o, cb) {
        cb(
          null,
          fs
            .readFileSync(path.join(__dirname, '/fixture/removeAll.txt'))
            .toString()
        );
      });

      notifier.notify({ remove: 'ALL' }, function (_, response) {
        expect(response).toBeTruthy();

        utils.fileCommandJson = asyncify(function (n, o, cb) {
          cb(null, '');
        });

        notifier.notify({ list: 'ALL' }, function (_, response) {
          expect(response).toBeFalsy();
          done();
        });
      });
    });
  });

  describe('arguments', function () {
    beforeEach(function () {
      this.original = utils.fileCommandJson;
    });

    afterEach(function () {
      utils.fileCommandJson = this.original;
    });

    function expectArgsListToBe(expected, done) {
      utils.fileCommandJson = asyncify(function (notifier, argsList, callback) {
        expect(argsList).toEqual(expected);
        callback();
        done();
      });
    }

    it('should allow for non-sensical arguments (fail gracefully)', function (done) {
      const expected = [
        '-title',
        '"title"',
        '-message',
        '"body"',
        '-tullball',
        '"notValid"',
        '-timeout',
        '"10"',
        '-json',
        '"true"'
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
    });

    it('should validate and transform sound to default sound if Windows sound is selected', function (done) {
      utils.fileCommandJson = asyncify(function (notifier, argsList, callback) {
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
    });

    it('should convert list of actions to flat list', function (done) {
      const expected = [
        '-title',
        '"title \\"message\\""',
        '-message',
        '"body \\"message\\""',
        '-actions',
        '"foo","bar","baz \\"foo\\" bar"',
        '-timeout',
        '"10"',
        '-json',
        '"true"'
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
    });

    it('should still support wait flag with default timeout', function (done) {
      const expected = [
        '-title',
        '"Title"',
        '-message',
        '"Message"',
        '-timeout',
        '"5"',
        '-json',
        '"true"'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({ title: 'Title', message: 'Message', wait: true });
    });

    it('should let timeout set precedence over wait', function (done) {
      const expected = [
        '-title',
        '"Title"',
        '-message',
        '"Message"',
        '-timeout',
        '"10"',
        '-json',
        '"true"'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'Title',
        message: 'Message',
        wait: true,
        timeout: 10
      });
    });

    it('should not set a default timeout if explicitly false', function (done) {
      const expected = [
        '-title',
        '"Title"',
        '-message',
        '"Message"',
        '-json',
        '"true"'
      ];

      expectArgsListToBe(expected, done);
      const notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'Title',
        message: 'Message',
        timeout: false
      });
    });

    it('should escape all title and message', function (done) {
      const expected = [
        '-title',
        '"title \\"message\\""',
        '-message',
        '"body \\"message\\""',
        '-tullball',
        '"notValid"',
        '-timeout',
        '"10"',
        '-json',
        '"true"'
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
    });
  });
});
