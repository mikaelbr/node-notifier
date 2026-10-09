/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
import { EventEmitter } from 'node:events';
import path from 'node:path';
import callableClass from '../lib/callableClass.js';
import utils from '../lib/utils.js';
import Growl from './growl.js';

const notifier = path.join(
  import.meta.dirname,
  '../vendor/mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier'
);

const errorMessageOsX =
  'You need Mac OS X 10.8 or above to use NotificationCenter,' +
  ' or use Growl fallback with constructor option {withFallback: true}.';

class NotificationCenter extends EventEmitter {
  #notify;

  constructor(options) {
    super();
    this.options = utils.clone(options || {});
    this._activeNotifications = new Set();
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify() {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }

  /**
   * Kill all running terminal-notifier processes started by this instance, so
   * the application can exit without waiting for their timeouts. Callbacks of
   * cleared notifications are called without an error or response.
   */
  clearAll() {
    for (const clear of this._activeNotifications) clear();
    this._activeNotifications.clear();
  }
}

const Notifier = callableClass(NotificationCenter);

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

let activeId = null;

function noop() {}
function notifyRaw(options, callback) {
  const id = {};
  options = utils.clone(options || {});
  activeId = id;

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }
  callback = callback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  const actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    (data) => {
      if (activeId !== id) return false;

      if (data === 'activate') {
        return 'click';
      }
      if (data === 'timeout') {
        return 'timeout';
      }
      if (data === 'replied') {
        return 'replied';
      }
      return false;
    }
  );

  options = utils.mapToMac(options);

  if (!options.message && !options.group && !options.list && !options.remove) {
    callback(new Error('Message, group, remove or list property is required.'));
    return this;
  }

  const argsList = utils.constructArgumentList(options);
  if (utils.isMountainLion()) {
    let finished = false;
    let cleared = false;
    const clear = () => {
      cleared = true;
      child.kill();
    };
    const child = utils.fileCommandJson(
      this.options.customPath || notifier,
      argsList,
      (err, data) => {
        finished = true;
        this._activeNotifications.delete(clear);
        // Being killed by clearAll is expected, not an error.
        if (cleared) return actionJackedCallback(null);
        actionJackedCallback(err, data);
      }
    );
    if (child && !finished) this._activeNotifications.add(clear);
    return this;
  }

  if (this.options.withFallback) {
    return new Growl(this.options).notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
}
