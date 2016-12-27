/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
var path = require('path'),
    notifier = path.join(__dirname, '../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier'),
    utils = require('../lib/utils'),
    Growl = require('./growl'),
    cloneDeep = require('lodash.clonedeep');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var errorMessageOsX = 'You need Mac OS X 10.8 or above to use NotificationCenter,' +
                        ' or use Growl fallback with constructor option {withFallback: true}.';

module.exports = NotificationCenter;

function NotificationCenter (options) {
  options = cloneDeep(options || {});
  if (!(this instanceof NotificationCenter)) {
    return new NotificationCenter(options);
  }
  this.options = options;

  EventEmitter.call(this);
}
util.inherits(NotificationCenter, EventEmitter);
var activeId = null;

NotificationCenter.prototype.notify = function (title, message, callback) {
  var fallbackNotifier = null, id = identificator();
  var options = {};
  activeId = id;

  if (typeof title === 'object') {
    options = cloneDeep(title || {});

    if (typeof message === 'function') {
      callback = message;
    }
  } else if (typeof title === 'string') {
    if (typeof message === 'function') {
      callback = message;
      options = {
        title: 'node-notifier',
        message: title
      };
    } else {
      options = {
        title: title,
        message: message || 'node-notifier'
      };
    }
  }

  callback = callback || function () {};
  var actionJackedCallback = utils.actionJackerDecorator(this, options, callback, function (data) {
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
  });

  options = utils.mapToMac(options);

  if (!options.message && !options.group && !options.list && !options.remove) {
    callback(new Error('Message, group, remove or list property is required.'));
    return this;
  }

  var argsList = utils.constructArgumentList(options);

  if(utils.isMountainLion()) {
    utils.fileCommandJson(this.options.customPath || notifier, argsList, actionJackedCallback);
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
