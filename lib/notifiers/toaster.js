/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
var path = require('path'),
    notifier = path.resolve(__dirname, '../../vendor/toaster/toast.exe'),
    utils = require('../utils'),
    Balloon = require('./balloon');

var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }

  this.options = options;
};

Notifier.prototype.notify = function (options, callback) {
  var fallback;
  options.title = options.title || 'Node Notification:';
  callback = callback || function (err, data) {};

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (!utils.isWin8()) {
    fallback = new Balloon(this.options);
    return fallback.notify(options, callback);
  }

  options = utils.mapToWin8(options);
  var argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true
  });
  utils.windowsCommand(notifier, argsList, callback);
  return this;
};

module.exports = Notifier;