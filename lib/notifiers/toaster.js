/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
var path = require('path'),
    notifier = path.resolve(__dirname, '../../vendor/toaster/toast.exe'),
    utils = require('../utils'),
    Balloon = require('./balloon');

var fallback = void 0;

function WindowsToaster (options) {
  options = options || {};
  if (!(this instanceof WindowsToaster)) {
    return new WindowsToaster(options);
  }

  this.options = options;
};

WindowsToaster.prototype.notify = function (options, callback) {

  options = options || {};
  options.title = options.title || 'Node Notification:';
  callback = callback || function (err, data) {};

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (!utils.isWin8() && !!this.options.withFallback) {
    fallback = fallback || new Balloon(this.options);
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

module.exports = WindowsToaster;
