/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
const utils = require('../lib/utils');
const Growl = require('./growl');
const path = require('path');
const notifier = path.join(
  __dirname,
  '../vendor/mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier'
);

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const errorMessageOsX =
  'You need Mac OS X 10.8 or above to use NotificationCenter,' +
  ' or use Growl fallback with constructor option {withFallback: true}.';

module.exports = NotificationCenter;

function NotificationCenter(options) {
  options = utils.clone(options || {});
  if (!(this instanceof NotificationCenter)) {
    return new NotificationCenter(options);
  }
  this.options = options;
  this._activeNotifications = new Set();

  EventEmitter.call(this);
}
util.inherits(NotificationCenter, EventEmitter);
let activeId = null;

/**
 * Kill all running terminal-notifier processes started by this instance, so
 * the application can exit without waiting for their timeouts. Callbacks of
 * cleared notifications are called without an error or response.
 */
NotificationCenter.prototype.clearAll = function () {
  for (const clear of this._activeNotifications) clear();
  this._activeNotifications.clear();
};

function noop() {}
function notifyRaw(options, callback) {
  let fallbackNotifier;
  const id = identificator();
  options = utils.clone(options || {});
  activeId = id;

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }
  callback = callback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      'The second argument must be a function callback. You have passed ' +
        typeof callback
    );
  }

  const actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    function (data) {
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
    const clear = function () {
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

  if (fallbackNotifier || this.options.withFallback) {
    fallbackNotifier = fallbackNotifier || new Growl(this.options);
    return fallbackNotifier.notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
}

Object.defineProperty(NotificationCenter.prototype, 'notify', {
  get: function () {
    if (!this._notify) this._notify = notifyRaw.bind(this);
    return this._notify;
  }
});

function identificator() {
  return { _ref: 'val' };
}
