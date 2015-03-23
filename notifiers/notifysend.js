/**
 * Node.js wrapper for "notify-send".
 */
var os = require('os'),
    which = require('which'),
    utils = require('../lib/utils');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var notifier = 'notify-send', hasNotifier = void 0;

module.exports = NotifySend;

function NotifySend (options) {
  options = options || {};
  if (!(this instanceof NotifySend)) {
    return new NotifySend(options);
  }

  this.options = options;

  EventEmitter.call(this);
}
util.inherits(NotifySend, EventEmitter);

NotifySend.prototype.notify = function (options, callback) {
  if (typeof options === 'string') {
    options = { message: options };
  }
  options = options || {};
  callback = callback || function () {};

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (os.type() !== 'Linux') {
    callback(new Error('Only supported on Linux systems'));
    return this;
  }

  if (hasNotifier === false) {
    callback(new Error('notify-send must be installed on the system.'));
    return this;
  }

  if (hasNotifier || !!this.options.suppressOsdCheck) {
    doNotification(options, callback);
    return this;
  }

  which(notifier, function (err) {
    hasNotifier = !err;

    if (err) {
      return callback(err);
    }

    doNotification(options, callback);
  });
  return this;
};

var allowedArguments = [
  "urgency",
  "expire-time",
  "icon",
  "category",
  "hint"
];

function doNotification (options, callback) {
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
}
