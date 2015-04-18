/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
var path = require('path'),
    notifier = path.join(__dirname, '../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier'),
    utils = require('../lib/utils'),
    Growl = require('./growl');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var errorMessageOsX = 'You need Mac OS X 10.8 or above to use NotificationCenter,' +
                        ' or use Growl fallback with constructor option {withFallback: true}.';

module.exports = NotificationCenter;

function NotificationCenter (options) {

  options = options || {};

  if (!(this instanceof NotificationCenter)) {
    return new NotificationCenter(options);
  }
  this.options = options;

  EventEmitter.call(this);
}
util.inherits(NotificationCenter, EventEmitter);
var activeId = null;

NotificationCenter.prototype.notify = function (options, callback) {
  var fallbackNotifier = null, id = identificator();

  if (typeof options === 'string') {
    options = { message: options };
  }
  options = options || {};

  activeId = id;

  callback = callback || function () {};
  var actionJackedCallback = utils.actionJackerDecorator(this, options, callback, function (data) {
    if (activeId !== id) return false;

    var cleaned = data.toLowerCase().trim();
    if (cleaned === 'activate') {
      return 'click';
    }
    if (cleaned === 'timeout') {
      return 'timeout';
    }
    return false;
  });

  options = utils.mapToMac(options);
  if (!!options.wait) {
    options.wait = 'YES';
  }

  if (!options.message && !options.group && !options.list && !options.remove) {
    callback(new Error('Message, group, remove or list property is required.'));
    return this;
  }

  var argsList = utils.constructArgumentList(options);

  if(utils.isMountainLion()) {
    utils.command(this.options.customPath || notifier, argsList, actionJackedCallback);
    return this;
  }

  if (fallbackNotifier || !!this.options.withFallback) {
    fallbackNotifier = fallbackNotifier || new Growl(this.options);
    return fallbackNotifier.notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
};

function identificator () {
  return { _ref: 'val' };
}
