/**
 * A Node.js wrapper for terminal-notify.
 *
 * Requirements:
 *  - Mac OS X 10.8
 */

var path = require('path')
  , notifier = path.resolve(__dirname, '../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier')
  , utils = require('./utils');

var Notifier = function () {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  this.isOSX = false;
}
, constructArgumentList = function (options) {
  var args = [];

  for(var key in options) {
    var val = options[key];
    args.push('-' + key, '"' + val + '"');
  }

  return args;
}
, cbAnnotator = function (cb) {
  return function (err, data) {
    cb(err, utils.parseCLIOutput(data));
  };
};

Notifier.prototype.notify = function (options, callback) {
    var argsList = constructArgumentList(options);
    callback = cbAnnotator(callback || function (err, data) {});

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

module.exports = new Notifier();