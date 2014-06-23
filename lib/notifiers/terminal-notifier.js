/**
 * A Node.js wrapper for terminal-notify.
 *
 * Requirements:
 *  - Mac OS X 10.8
 */

var path = require('path')
  , notifier = path.resolve(__dirname, '../../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier')
  , utils = require('../utils');

var Notifier = function () {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  this.isOSX = false;
};

Notifier.prototype.notify = function (options, callback) {
  options = utils.mapToMac(options);

  var argsList = utils.constructArgumentList(options);
  callback = callback || function (err, data) {};

  if(this.isOSX) {
    utils.command(notifier, argsList, callback);
    return this;
  }

  var self = this;
  utils.isMacOSX(function (error, errorMsg) {
    if (error) {
      return callback(new Error(errorMsg));
    }
    utils.command(notifier, argsList, callback);
    self.isOSX = true;
  });
  return this;
};

module.exports = Notifier;
