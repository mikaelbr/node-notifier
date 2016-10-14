var NotificationCenter = require('../notifiers/notificationcenter')
  , Growl = require('../notifiers/growl')
  , should = require('should')
  , os = require('os')
  , fs = require('fs')
  , utils = require('../lib/utils')
  , assert = require('assert');

var notifier = null;
var originalUtils = utils.fileCommandJson;
var originalMacVersion = utils.isMountainLion;
var originalType = os.type;

describe('Mac fallback', function () {
  var original = utils.isMountainLion;
  var originalMac = utils.isMac;

  after(function () {
    utils.isMountainLion = original;
    utils.isMac = originalMac;
  })

  it('should default to Growl notification if older Mac OSX than 10.8', function(done){
    utils.isMountainLion = function () {
      return false;
    };
    utils.isMac = function () {
      return true;
    };
    var n = new NotificationCenter({ withFallback: true });

    n.notify({
      message: "Hello World"
    }, function (err, response) {
      (this instanceof Growl).should.be.true;
      done();
    });

  });

  it('should not fallback to Growl notification if withFallback is false', function(done){
    utils.isMountainLion = function () {
      return false;
    };
    utils.isMac = function () {
      return true;
    };
    var n = new NotificationCenter();
    n.notify({
      message: "Hello World"
    }, function (err, response) {
      err.should.be.ok;
      (this instanceof Growl).should.be.false;
      done();
    });

  });
});

describe('terminal-notifier', function(){

  before(function () {
    os.type = function () {
      return "Darwin";
    };

    utils.isMountainLion = function () {
      return true;
    }
  });

  beforeEach(function () {
    notifier = new NotificationCenter();
  });

  after(function () {
    os.type = originalType;
    utils.isMountainLion = originalMacVersion;
  });

  describe('#notify()', function(){

    beforeEach(function () {
      utils.fileCommandJson = function (n, o, cb) {
        cb(null, "");
      }
    });

    after(function () {
      utils.fileCommandJson = originalUtils;
    });

    it('should notify with a message', function(done){

      notifier.notify({
        message: "Hello World"
      }, function (err, response) {
        (err === null).should.be.true;
        done();
      });

    });


    it('should be chainable', function(done){

      notifier.notify({
        message: "First test"
      }).notify({
        message: "Second test"
      }, function (err, response) {
        (err === null).should.be.true;
        done();
      });

    });

    it('should be able to list all notifications', function(done){
      utils.fileCommandJson = function (n, o, cb) {
        cb(null, fs.readFileSync(__dirname + '/fixture/listAll.txt').toString());
      };

      notifier.notify({
          list: "ALL"
        }, function (err, response) {
          response.should.be.ok;
          done();
        });
    });


    it('should be able to remove all messages', function(done){
      utils.fileCommandJson = function (n, o, cb) {
        cb(null, fs.readFileSync(__dirname + '/fixture/removeAll.txt').toString());
      }

      notifier.notify({
        remove: "ALL"
      }, function (err, response) {
        response.should.be.ok;

        utils.fileCommandJson = function (n, o, cb) {
          cb(null, "");
        }

        notifier.notify({
          list: "ALL"
        }, function (err, response) {
          response.should.not.be.ok;
          done();
        });
      });
    });
  });

  describe("arguments", function () {
    before(function () {
      this.original = utils.fileCommandJson;
    });

    after(function () {
      utils.fileCommandJson = this.original;
    });

    it('should allow for non-sensical arguments (fail gracefully)', function (done) {
      var expected = [ '-title', '"title"', '-message', '"body"', '-tullball', '"notValid"', '-json', '"true"' ]

      utils.fileCommandJson = function (notifier, argsList, callback) {
        argsList.should.eql(expected);
        done();
      };

      var notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: "title",
        message: "body",
        tullball: "notValid"
      }, function (err) {
        should.not.exist(err);
        done();
      });
    });

    it('should convert list of actions to flat list', function (done) {
      var expected = [
        '-title', '"title \\"message\\""',
        '-message', '"body \\"message\\""',
        '-actions', '"foo","bar","baz \\"foo\\" bar"',
        '-json', '"true"'
      ];

      utils.fileCommandJson = function (notifier, argsList, callback) {
        argsList.should.eql(expected);
        done();
      };

      var notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'title "message"',
        message: 'body "message"',
        actions: ['foo', 'bar', 'baz "foo" bar']
      }, function (err) {
        should.not.exist(err);
      });
    });

    it('should still support wait flag with default timeout', function (done) {
      var expected = [
        '-title', '"Title"',
        '-message', '"Message"',
        '-timeout', '"5"',
        '-json', '"true"'
      ];

      utils.fileCommandJson = function (notifier, argsList, callback) {
        argsList.should.eql(expected);
        done();
      };

      var notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'Title',
        message: 'Message',
        wait: true
      }, function (err) {
        should.not.exist(err);
      });
    });

    it('should let timeout set precedence over wait', function (done) {
      var expected = [
        '-title', '"Title"',
        '-message', '"Message"',
        '-timeout', '"10"',
        '-json', '"true"'
      ];

      utils.fileCommandJson = function (notifier, argsList, callback) {
        argsList.should.eql(expected);
        done();
      };

      var notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'Title',
        message: 'Message',
        wait: true,
        timeout: 10
      }, function (err) {
        should.not.exist(err);
      });
    });


    it('should escape all title and message', function (done) {
      var expected = [ '-title', '"title \\"message\\""',
      '-message', '"body \\"message\\""', '-tullball', '"notValid"',
      '-json', '"true"' ]

      utils.fileCommandJson = function (notifier, argsList, callback) {
        argsList.should.eql(expected);
        done();
      };

      var notifier = new NotificationCenter();
      notifier.isNotifyChecked = true;
      notifier.hasNotifier = true;

      notifier.notify({
        title: 'title "message"',
        message: 'body "message"',
        tullball: "notValid"
      }, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });
});
