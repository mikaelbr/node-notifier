/**
 * Node.js wrapper for "notify-send".
 */

var path = require('path'),
    os = require('os'),
    which = require('which'),
    utils = require('../utils');

var notifier = 'notify-send';

var Notifier = function () {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  this.isNotifyChecked = false;
  this.hasNotifier = false;
};

var allowedArguments = [
  "urgency",
  "expire-time",
  "icon",
  "category",
  "hint"
];

var doNotification = function (options, callback) {
  var initial, argsList;

  options = utils.mapToNotifySend(options);
  options.title = options.title || 'Node Notification:';

  initial = [options.title, options.message];
  delete options.title;
  delete options.message;

  argsList = utils.constructArgumentList(options, {
    initial: initial,
    keyExtra: '-',
    allowedArguments: allowedArguments
  });

  utils.command(notifier, argsList, callback);
  return this;
};

Notifier.prototype.notify = function (options, callback) {
  var that = this;

  callback = callback || function () {};

  options = options || {};
  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (os.type() !== 'Linux') {
    callback(new Error('Only supported on Linux systems'));
    return this;
  }

  if (this.isNotifyChecked && this.hasNotifier) {
    doNotification(options, callback);
    return this;
  }

  if (this.isNotifyChecked && !this.hasNotifier) {
    callback(new Error('notify-send must be installed on the system.'));
    return this;
  }

  which(notifier, function (err) {
    that.isNotifyChecked = true;
    that.hasNotifier = !err;

    if (err) {
      return callback(err);
    }

    return doNotification(options, callback);
  });
  return this;
};

module.exports = Notifier;
