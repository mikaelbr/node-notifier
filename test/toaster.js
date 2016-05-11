var Notify = require('../notifiers/toaster')
  , should = require('should')
  , path = require('path')
  , utils = require('../lib/utils')
  , os = require('os')
  , assert = require('assert');

describe('WindowsToaster', function(){

  before(function () {
    this.original = utils.fileCommand;
    this.originalType = os.type;
    this.originalArch = os.arch;
    this.originalRelease = os.release;
    os.release = function () {
      return "6.2.9200";
    };
    os.type = function () {
      return "Windows_NT";
    };
  });

  after(function () {
    utils.fileCommand = this.original;
    os.type = this.originalType;
    os.arch = this.originalArch;
    os.release = this.originalRelease;
  });

  it('should parse file protocol URL', function (done) {
    utils.fileCommand = function (notifier, argsList, callback) {
      argsList[1].should.eql("C:\\node-notifier\\test\\fixture\\coulson.jpg");
      done();
    };

    var notifier = new Notify();

    notifier.notify({
      'title': 'Heya',
      'message': 'foo bar',
      'icon': 'file:///C:/node-notifier/test/fixture/coulson.jpg'
    });
  });
});
