var Notify = require('../notifiers/notifysend')
  , should = require('should')
  , utils = require('../lib/utils')
  , os = require('os')
  , assert = require('assert');

describe('notify-send', function(){

  before(function () {
    this.original = utils.command;
    this.originalType = os.type;
    os.type = function () {
      return "Linux";
    };
  });

  after(function () {
    utils.command = this.original;
    os.type = this.originalType;
  });

  it('should pass on title and body', function (done) {
    var expected = [ '"title"', '"body"' ];

    utils.command = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
      title: "title",
      message: "body"
    }, function (err) {
      should.not.exist(err);
      done();
    })
  });

  it('should pass have default title', function (done) {
    var expected = [ '"Node Notification:"', '"body"' ];

    utils.command = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
      message: "body"
    }, function (err) {
      should.not.exist(err);
      done();
    })
  });


  it('should throw error if no message is passed', function (done) {

    utils.command = function (notifier, argsList, callback) {
      should.not.exist(argsList);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
    }, function (err) {
      err.message.should.equal("Message is required.");
      done();
    })
  });


  it('should escape message input', function (done) {
    var expected = [ '"Node Notification:"', '"some\\n \\"me\'ss\\`age\\`\\""' ];

    utils.command = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
      message: 'some\n "me\'ss`age`"'
    }, function (err) {
      should.not.exist(err);
      done();
    })
  });

  it('should send additional parameters as --"keyname"', function (done) {
    var expected = [ '"title"', '"body"', '--icon', '"icon-string"' ]

    utils.command = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
      title: "title",
      message: "body",
      icon: "icon-string"
    }, function (err) {
      should.not.exist(err);
      done();
    })
  });

  it('should remove extra options that are not supported by notify-send', function (done) {
    var expected = [ '"title"', '"body"', '--icon', '"icon-string"' ]

    utils.command = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify({ suppressOsdCheck: true });

    notifier.notify({
      title: "title",
      message: "body",
      icon: "icon-string",
      tullball: "notValid"
    }, function (err) {
      should.not.exist(err);
      done();
    })
  });

});
