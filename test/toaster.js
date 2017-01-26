var Notify = require('../notifiers/toaster');
var utils = require('../lib/utils');
var path = require('path');
var os = require('os');
var should = require('should');
var testUtils = require('./_test_utils');

describe('WindowsToaster', function() {
  before(function() {
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

  after(function() {
    utils.fileCommand = this.original;
    os.type = this.originalType;
    os.arch = this.originalArch;
    os.release = this.originalRelease;
  });

  it('should only pass allowed options and proper named properties', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      testUtils.argsListHas(argsList, '-t').should.be.true();
      testUtils.argsListHas(argsList, '-m').should.be.true();
      testUtils.argsListHas(argsList, '-w').should.be.true();
      testUtils.argsListHas(argsList, '-p').should.be.true();
      testUtils.argsListHas(argsList, '-id').should.be.true();
      testUtils.argsListHas(argsList, '-appID').should.be.true();
      testUtils.argsListHas(argsList, '-install').should.be.true();
      testUtils.argsListHas(argsList, '-close').should.be.true();

      testUtils.argsListHas(argsList, '-foo').should.be.false();
      testUtils.argsListHas(argsList, '-bar').should.be.false();
      testUtils.argsListHas(argsList, '-message').should.be.false();
      testUtils.argsListHas(argsList, '-title').should.be.false();
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
      should(testUtils.getOptionValue(argsList, '-w')).not.equal('true');
      should(testUtils.getOptionValue(argsList, '-silent')).not.equal('true');
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

  it('should translate from notification centers appIcon', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      testUtils.argsListHas(argsList, '-p').should.be.true();
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      message: 'Heya',
      appIcon: 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });

  it('should wrap message and title', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(testUtils.getOptionValue(argsList, '-t')).equal('Heya');
      should(testUtils.getOptionValue(argsList, '-m')).equal('foo bar');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar'
    });
  });

  it('should validate and transform sound to default sound if Mac sound is selected', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(testUtils.getOptionValue(argsList, '-t')).equal('Heya');
      should(testUtils.getOptionValue(argsList, '-s')).equal('Notification.Default');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      sound: 'Frog'
    });
  });

  it('sound as true should select default value', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(testUtils.getOptionValue(argsList, '-s')).equal('Notification.Default');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      message: 'foo bar',
      sound: true
    });
  });

  it('sound as false should be same as silent', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      testUtils.argsListHas(argsList, '-silent').should.be.true();
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      message: 'foo bar',
      sound: false
    });
  });

  it('should override sound', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(testUtils.getOptionValue(argsList, '-s')).equal('Notification.IM');
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
      argsList[1].should.eql('C:\\node-notifier\\test\\fixture\\coulson.jpg');
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
      argsList[1].should.eql(icon);
      done();
    };

    var notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });

  it('should not parse normal URL of icon', function(done) {
    var icon = 'http://csscomb.com/img/csscomb.jpg';
    utils.fileCommand = function(notifier, argsList, callback) {
      argsList[1].should.eql(icon);
      done();
    };

    var notifier = new Notify();
    notifier.notify({ title: 'Heya', message: 'foo bar', icon: icon });
  });
});
