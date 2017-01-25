var Notify = require('../notifiers/toaster');
var utils = require('../lib/utils');
var path = require('path');
var os = require('os');
var should = require('should');

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

  function argsListHas (args, field) {
    return args.filter(function (item) {
      return item === field;
    }).length > 0;
  }

  function getOptionValue (args, field) {
    for(var i = 0; i < args.length; i++){
      if (args[i] === field && i < args.length - 1) {
        return args[i + 1];
      }
    }
    return void 0;
  }

  it('should only pass allowed options and proper named properties', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      argsListHas(argsList, '-t').should.be.true();
      argsListHas(argsList, '-m').should.be.true();
      argsListHas(argsList, '-w').should.be.true();
      argsListHas(argsList, '-p').should.be.true();
      argsListHas(argsList, '-id').should.be.true();

      argsListHas(argsList, '-foo').should.be.false();
      argsListHas(argsList, '-bar').should.be.false();
      argsListHas(argsList, '-message').should.be.false();
      argsListHas(argsList, '-title').should.be.false();
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar',
      extra: 'dsakdsa',
      foo: 'bar',
      bar: true,
      icon: 'file:///C:/node-notifier/test/fixture/coulson.jpg',
      id: 1337,
      sound: 'Notification.IM',
      wait: true
    });
  });

  it('should pass wait and silent without parameters', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(getOptionValue(argsList, '-w')).not.equal('true');
      should(getOptionValue(argsList, '-silent')).not.equal('true');
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
      argsListHas(argsList, '-p').should.be.true();
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
      should(getOptionValue(argsList, '-t')).equal('Heya');
      should(getOptionValue(argsList, '-m')).equal('foo bar');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo bar'
    });
  });


  it('should escape message and title', function(done) {
    utils.fileCommand = function(notifier, argsList, callback) {
      should(getOptionValue(argsList, '-t')).equal('Heya');
      should(getOptionValue(argsList, '-m')).equal('foo "bar"');
      done();
    };
    var notifier = new Notify();

    notifier.notify({
      title: 'Heya',
      message: 'foo "bar"'
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
