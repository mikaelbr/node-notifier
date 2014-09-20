/**
 * A Node.js wrapper for terminal-notify.
 *
 * Requirements:
 *  - Mac OS X 10.8
 */

var path = require('path'),
    notifier = path.resolve(__dirname, '../../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier'),
    utils = require('../utils'),
    Growl = require('./growl');


var fallbackNotifier = null;
var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  this.options = options;
  this.isOSX = false;
  fallbackNotifier = null;
};

Notifier.prototype.notify = function (options, callback) {
  options = utils.mapToMac(options);

  var argsList = utils.constructArgumentList(options);
  callback = callback || function (err, data) {};

  if(this.isOSX) {
    utils.command(notifier, argsList, callback);
    return this;
  }

  if(fallbackNotifier) {
    fallbackNotifier.notify(options, callback);
    return this;
  }

  var self = this;
  utils.isMacOSX(function (error, errorMsg) {
    if (error && error !== 'old') {
      return callback(new Error(errorMsg));
    }

    if (error && error === 'old') {
      fallbackNotifier = new Growl(self.options);
      return fallbackNotifier.notify(options, callback);
    }

    utils.command(notifier, argsList, callback);
    self.isOSX = true;
  });
  return this;
};

module.exports = Notifier;
