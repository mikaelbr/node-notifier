var Notify = require('../notifiers/growl'),
  should = require('should'),
  growly = require('growly');

describe('growl', function(){

  beforeEach(function () {
    this.original = growly.notify;
  });

  afterEach(function () {
    growly.notify = this.original;
  });


  it('should have overridable host and port', function () {
    var notifier = new Notify();
    should(notifier.options.host).equal(void 0);
    should(notifier.options.port).equal(void 0);

    notifier = new Notify({ host: 'foo', port: 'bar' });
    should(notifier.options.host).equal('foo');
    should(notifier.options.port).equal('bar');
  });

  it('should pass host and port to growly', function (done) {
    growly.notify = function () {
      should(this.host).equal('foo');
      should(this.port).equal('bar');
      done();
    };

    var notifier = new Notify({ host: 'foo', port: 'bar' });
    notifier.notify({ message: "foo", wait: true });
  });

  it('should not override host/port if no options passed', function (done) {
    growly.notify = function () {
      should(this.host).equal(void 0);
      should(this.port).equal(void 0);
      done();
    };

    var notifier = new Notify();
    notifier.notify({ message: "foo", wait: true });
  });

});
