const Notify = require('../notifiers/growl');
const growly = require('growly');

describe('growl', function () {
  let original;

  beforeEach(function () {
    original = growly.notify;
  });

  afterEach(function () {
    growly.notify = original;
  });

  it('should have overridable host and port', function () {
    let notifier = new Notify();
    expect(notifier.options.host).toBeUndefined();
    expect(notifier.options.port).toBeUndefined();

    notifier = new Notify({ host: 'foo', port: 'bar' });
    expect(notifier.options.host).toBe('foo');
    expect(notifier.options.port).toBe('bar');
  });

  it('should pass host and port to growly', () =>
    new Promise((done) => {
      growly.notify = function () {
        expect(this.host).toBe('foo');
        expect(this.port).toBe('bar');
        done();
      };

      const notifier = new Notify({ host: 'foo', port: 'bar' });
      notifier.notify({ message: 'foo', wait: true });
    }));

  it('should not override host/port if no options passed', () =>
    new Promise((done) => {
      growly.notify = function () {
        expect(this.host).toBeUndefined();
        expect(this.port).toBeUndefined();
        done();
      };
      new Notify().notify({ message: 'foo', wait: true });
    }));
});
