import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Notify from '../src/notifiers/growl.ts';
import growly from 'growly';

describe('growl', function () {
  let original: typeof growly.notify;

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

    notifier = new Notify({ host: 'foo', port: 1234 });
    expect(notifier.options.host).toBe('foo');
    expect(notifier.options.port).toBe(1234);
  });

  it('should pass host and port to growly', () =>
    new Promise<void>((done) => {
      growly.notify = function (this: typeof growly) {
        expect(this.host).toBe('foo');
        expect(this.port).toBe(1234);
        done();
      };

      const notifier = new Notify({ host: 'foo', port: 1234 });
      notifier.notify({ message: 'foo', wait: true });
    }));

  it('should not override host/port if no options passed', () =>
    new Promise<void>((done) => {
      growly.notify = function (this: typeof growly) {
        expect(this.host).toBeUndefined();
        expect(this.port).toBeUndefined();
        done();
      };
      new Notify().notify({ message: 'foo', wait: true });
    }));

  it('should not allow header injection through CRLF', () =>
    new Promise<void>((done) => {
      growly.notify = function (text, opts) {
        expect(text).toBe('foo\nNotification-Callback-Target: http://evil');
        expect(opts?.title).toBe('bar\nbaz');
        done();
      };
      new Notify().notify({
        title: 'bar\r\nbaz',
        message: 'foo\r\nNotification-Callback-Target: http://evil',
        wait: true
      });
    }));
});
