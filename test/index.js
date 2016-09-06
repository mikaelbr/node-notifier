var should = require('should');

var notifier = require('../');

describe('constructors', function(){

  it('should expose a default selected instance', function () {
    should(notifier.notify).be.ok;
  });

  it('should expect only a function callback as second parameter', function () {
    var cb = function (err, data) {};
    var data = { 'title': 'My notification' };

    should(notifier.notify(data, cb)).be.ok;
  });

  it('should throw error when second parameter is not a function', function () {
    var wrongParamOne = 200;
    var wrongParamTwo = 'meaningless string';
    var data = { 'title': 'My notification' };

    notifier.notify.bind(notifier, data, wrongParamOne).should.throw(/^The second argument/);
    notifier.notify.bind(notifier, data, wrongParamTwo).should.throw(/^The second argument/);
  });

  it('should expose a default selected constructor function', function () {
    should(notifier instanceof notifier.Notification).be.ok;
  });

  it('should expose constructor for WindowsBalloon', function () {
    should(notifier.WindowsBalloon).be.ok;
  });

  it('should expose constructor for WindowsToaster', function () {
    should(notifier.WindowsToaster).be.ok;
  });

  it('should expose constructor for NotifySend', function () {
    should(notifier.NotifySend).be.ok;
  });

  it('should expose constructor for Growl', function () {
    should(notifier.Growl).be.ok;
  });
});
