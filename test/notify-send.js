var Notify = require('../notifiers/notifysend');
var utils = require('../lib/utils');
var os = require('os');

describe('notify-send', function() {
  beforeEach(function() {
    this.original = utils.command;
    this.originalType = os.type;
    os.type = function() {
      return 'Linux';
    };
  });

  afterEach(function() {
    utils.command = this.original;
    os.type = this.originalType;
  });

  function expectArgsListToBe(expected, done) {
    utils.command = function(notifier, argsList, callback) {
      expect(argsList).toEqual(expected);
      done();
    };
  }

  it('should pass on title and body', function(done) {
    var expected = [ '"title"', '"body"' ];
    expectArgsListToBe(expected, done);
    var notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ title: 'title', message: 'body' });
  });

  it('should pass have default title', function(done) {
    var expected = [ '"Node Notification:"', '"body"' ];

    expectArgsListToBe(expected, done);
    var notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ message: 'body' });
  });

  it('should throw error if no message is passed', function(done) {
    utils.command = function(notifier, argsList, callback) {
      expect(argsList).toBeUndefined();
    };

    var notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({}, function(err) {
      expect(err.message).toBe('Message is required.');
      done();
    });
  });

  it('should escape message input', function(done) {
    var excapedNewline = process.platform === 'win32' ? '\\r\\n' : '\\n';
    var expected = [
      '"Node Notification:"',
      '"some' + excapedNewline + ' \\"me\'ss\\`age\\`\\""'
    ];

    expectArgsListToBe(expected, done);
    var notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ message: 'some\n "me\'ss`age`"' });
  });

  it('should send additional parameters as --"keyname"', function(done) {
    var expected = [ '"title"', '"body"', '--icon', '"icon-string"' ];

    expectArgsListToBe(expected, done);
    var notifier = new Notify({ suppressOsdCheck: true });
    notifier.notify({ title: 'title', message: 'body', icon: 'icon-string' });
  });

  it(
    'should remove extra options that are not supported by notify-send',
    function(done) {
      var expected = [ '"title"', '"body"', '--icon', '"icon-string"' ];

      expectArgsListToBe(expected, done);
      var notifier = new Notify({ suppressOsdCheck: true });
      notifier.notify({
        title: 'title',
        message: 'body',
        icon: 'icon-string',
        tullball: 'notValid'
      });
    }
  );
});
