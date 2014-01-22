/**
 * Node.js wrapper for "notify-send".
 */

var path = require('path')
  , os = require('os')
  , utils = require('./utils');

var notifier = 'notify-send'

var Notifier = function () {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
}
, constructArgumentList = function (options, initial) {
  var args = [];

  initial.forEach(function (val) {
    args.push('"' + val + '"');
  });

  for(var key in options) {
    if (options.hasOwnProperty(key)) {
      args.push('-' + key, '"' + options[key] + '"');
    }
  }

  return args;
};

Notifier.prototype.notify = function (options, callback) {
  options = options || {};
  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (os.type() !== 'Linux') {
    callback(new Error('Only supported on Linux systems'));
    return this;
  }

  options.title = options.title || 'Node Notification:';
  var initial = [options.title, options.message];

  delete options.title;
  delete options.message;
  var argsList = constructArgumentList(options, initial);
  callback = callback || function (err, data) {};

  utils.command(notifier, argsList, callback);
  return this;
};

module.exports = new Notifier();