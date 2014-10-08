var Notify = require('../notifiers/balloon')
  , should = require('should')
  , utils = require('../lib/utils')
  , os = require('os')
  , assert = require('assert');

describe('WindowsBalloon', function(){

  before(function () {
    this.original = utils.immediateFileCommand;
    this.originalType = os.type;
    os.type = function () {
      return "Windows_NT";
    };
  });

  after(function () {
    utils.immediateFileCommand = this.original;
    os.type = this.originalType;
  });

  it('should pass on title and body', function (done) {
    var expected = [ '-m', 'body', '-p', 'title', '-q' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: "title",
      message: "body"
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should pass have default title', function (done) {
    var expected = [ '-m', 'body', '-q', '-p', 'Node Notification:' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      message: "body"
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should throw error if no message is passed', function (done) {

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      should.not.exist(argsList);
    };

    var notifier = new Notify();

    notifier.notify({
    }, function (err) {
      err.message.should.equal("Message is required.");
      done();
    });
  });

  it('should escape message input', function (done) {
    var expected = [ '-m', 'some "me\'ss\`age\`\"', '-q', '-p', 'Node Notification:' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      message: 'some "me\'ss`age`"'
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should be able to deactivate silent mode', function (done) {
    var expected = [ '-m', 'body', '-p', 'Node Notification:' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      message: "body",
      sound: true
    }, function (err) {
      should.not.exist(err);
    })
  });


  it('should be able to deactivate silent mode, by doing quiet false', function (done) {
    var expected = [ '-m', 'body', '-p', 'Node Notification:' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      message: "body",
      quiet: false
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should send set time', function (done) {
    var expected = [ '-m', 'body', '-p', 'title', '-d', '1000', '-q' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: "title",
      message: "body",
      time: "1000"
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should not send false flags', function (done) {
    var expected = [ '-d', '1000', '-i', 'icon', '-m', 'body', '-p', 'title', '-q' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: "title",
      message: "body",
      d: "1000",
      icon: 'icon',
      w: false
    }, function (err) {
      should.not.exist(err);
    })
  });


  it('should send additional parameters as --"keyname"', function (done) {
    var expected = [ '-d', '1000', '-w', '-i', 'icon', '-m', 'body', '-p', 'title', '-q' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: "title",
      message: "body",
      d: "1000",
      icon: 'icon',
      w: true
    }, function (err) {
      should.not.exist(err);
    })
  });

  it('should remove extra options that are not supported by notifu', function (done) {
    var expected = [ '-m', 'body', '-p', 'title', '-q' ];

    utils.immediateFileCommand = function (notifier, argsList, callback) {
      argsList.should.eql(expected);
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      title: "title",
      message: "body",
      tullball: "notValid"
    }, function (err) {
      should.not.exist(err);
    })
  });

});
