var nn = require('../')
  , NotificationCenter = nn.NotificationCenter
  , Growl = nn.Growl
  , should = require('should')
  , os = require('os')
  , fs = require('fs')
  , utils = require('../lib/utils')
  , assert = require('assert');

var _ = require('../lib/utils');

var notifier = null;
var originalUtils = utils.command;
var originalIsMacOsX = utils.isMacOSX;
var originalType = os.type;
var originalVersion = _.getOSXVersion;

describe('node-notifier', function(){

  before(function () {
    os.type = function () {
      return "Darwin";
    };

    utils.isMacOSX = function (cb) {
      cb(false);
    };
  });

  beforeEach(function () {
    notifier = new NotificationCenter();
  });

  afterEach(function () {
    os.type = originalType;
    utils.isMacOSX = originalIsMacOsX;
    _.getOSXVersion = originalVersion;
  });

  describe('#notify()', function(){

    beforeEach(function () {
      utils.command = function (n, o, cb) {
        cb(null, "");
      }
    });

    after(function () {
      utils.command = originalUtils
    });

    it('should notify with a message', function(done){

      notifier.notify({
        message: "Hello World"
      }, function (err, response) {
        (err === null).should.be.true;
        done();
      });

    });

    it('should default to Growl notification if older Mac OSX than 10.8', function(done){
      _.getOSXVersion = function (cb) {
        cb(null, "10.7");
      };
      notifier.notify({
        message: "Hello World"
      }, function (err, response) {
        (this instanceof Growl).should.be.true;
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
      utils.command = function (n, o, cb) {
        cb(null, fs.readFileSync(__dirname + '/fixture/listAll.txt').toString());
      }

      notifier.notify({
          list: "ALL"
        }, function (err, response) {
          response.should.be.ok;
          done();
        });
    });


    it('should be able to remove all messages', function(done){
      utils.command = function (n, o, cb) {
        cb(null, fs.readFileSync(__dirname + '/fixture/removeAll.txt').toString());
      }

      notifier.notify({
        remove: "ALL"
      }, function (err, response) {
        response.should.be.ok;

        utils.command = function (n, o, cb) {
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
      this.original = utils.command;
    });

    after(function () {
      utils.command = this.original;
    });

    it('should allow for non-sensical arguments (fail gracefully)', function (done) {
      var expected = [ '-title', '"title"', '-message', '"body"', '-tullball', '"notValid"' ]

      utils.command = function (notifier, argsList, callback) {
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

    it('should escape all title and message', function (done) {
      var expected = [ '-title', '"title \\"message\\""',
      '-message', '"body \\"message\\""', '-tullball', '"notValid"' ]

      utils.command = function (notifier, argsList, callback) {
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
