const Notify = require('../notifiers/notifysend');
const utils = require('../lib/utils');
const os = require('os');

describe('notify-send', function () {
  const original = utils.command;
  const originalType = os.type;

  beforeEach(function () {
    os.type = function () {
      return 'Linux';
    };
  });

  afterEach(function () {
    utils.command = original;
    os.type = originalType;
  });

  function expectArgsListToBe(expected, done) {
    utils.command = function (notifier, argsList, callback) {
      expect(argsList).toEqual(expected);
      done();
    };
  }

  it('should pass on title and body', function (done) {
    const expected = ['"title"', '"body"', '--expire-time', '"10000"'];
    expectArgsListToBe(expected, done);
    const notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ title: 'title', message: 'body' });
  });

  it('should pass have default title', function (done) {
    const expected = [
      '"Node Notification:"',
      '"body"',
      '--expire-time',
      '"10000"'
    ];

    expectArgsListToBe(expected, done);
    const notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ message: 'body' });
  });

  it('should throw error if no message is passed', function (done) {
    utils.command = function (notifier, argsList, callback) {
      expect(argsList).toBeUndefined();
    };

    const notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({}, function (err) {
      expect(err.message).toBe('Message is required.');
      done();
    });
  });

  it('should escape message input', function (done) {
    const excapedNewline = process.platform === 'win32' ? '\\r\\n' : '\\n';
    const expected = [
      '"Node Notification:"',
      '"some' + excapedNewline + ' \\"me\'ss\\`age\\`\\""',
      '--expire-time',
      '"10000"'
    ];

    expectArgsListToBe(expected, done);
    const notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ message: 'some\n "me\'ss`age`"' });
  });

  it('should escape array items as normal items', function (done) {
    const expected = [
      '"Hacked"',
      '"\\`touch HACKED\\`"',
      '--app-name',
      '"foo\\`touch exploit\\`"',
      '--category',
      '"foo\\`touch exploit\\`"',
      '--expire-time',
      '"10000"'
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
  });

  it('should send additional parameters as --"keyname"', function (done) {
    const expected = [
      '"title"',
      '"body"',
      '--icon',
      '"icon-string"',
      '--expire-time',
      '"10000"'
    ];

    expectArgsListToBe(expected, done);
    const notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ title: 'title', message: 'body', icon: 'icon-string' });
  });

  it('should remove extra options that are not supported by notify-send', function (done) {
    const expected = [
      '"title"',
      '"body"',
      '--icon',
      '"icon-string"',
      '--expire-time',
      '"1000"'
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
  });
});
