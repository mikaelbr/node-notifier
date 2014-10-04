var should = require('should');

var notifier = require('../');

describe('constructors', function(){

  it('should expose a default selected instance', function () {
    should(notifier.notify).be.ok;
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
