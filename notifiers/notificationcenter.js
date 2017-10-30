/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
var utils = require('../lib/utils');
var Growl = require('./growl');
var path = require('path');
var notifier = path.join(__dirname, '../vendor/terminal-notifier');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var errorMessageOsX =
  'You need Mac OS X 10.8 or above to use NotificationCenter,' +
  ' or use Growl fallback with constructor option {withFallback: true}.';

module.exports = NotificationCenter;

function NotificationCenter(options) {
  options = utils.clone(options || {});
  if (!(this instanceof NotificationCenter)) {
    return new NotificationCenter(options);
  }
  this.options = options;
  this.notifications = [];

  EventEmitter.call(this);
}
util.inherits(NotificationCenter, EventEmitter);
var activeId = null;

/**
 * Call this to cancel timeouts on current notifications
 */
NotificationCenter.prototype.clearAll = function() {
  for (var i in this.notifications) {
    this.notifications[i].kill();
  }
  this.notifications = [];
};

function noop() {}
NotificationCenter.prototype.notify = function(options, callback) {
  var fallbackNotifier;
  var id = identificator();
  options = utils.clone(options || {});
  activeId = id;

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }
  callback = callback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      'The second argument must be a function callback. You have passed ' +
        typeof fn
    );
  }

  var actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    function(data) {
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

  var argsList = utils.constructArgumentList(options);
  if (utils.isMountainLion()) {
    // This will be the index of the newly added notification once its been
    // added
    let index = this.notifications.length;
    let p = utils.fileCommandJson(
      this.options.customPath || notifier,
      argsList,
      function(e, data) {
        // delete the notification since its been cleared
        this.notifications.splice(index, 1);
        actionJackedCallback(e, data);
      }.bind(this)
    );
    this.notifications.push(p);
    return this;
  }

  if (fallbackNotifier || !!this.options.withFallback) {
    fallbackNotifier = fallbackNotifier || new Growl(this.options);
    return fallbackNotifier.notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
};

function identificator() {
  return { _ref: 'val' };
}
