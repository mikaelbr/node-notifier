/**
 * A Node.js wrapper for terminal-notify.
 *
 * Requirements:
 *  - Mac OS X 10.8
 */

var child_process = require('child_process')
  , exec = child_process.exec
  , path = require('path')
  , notifier = path.resolve(__dirname, '../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier')
  , osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher';

var isMacOSX = function (cb) {
  if (process.platform != 'darwin') {
    return cb(true, osVersionError);
  }

  return exec("sw_vers -productVersion", function (error, stdout, stderr) {
    if (error) {
      return cb(true, error, stderr);
    }
    if (stdout >= "10.8") {
      return cb(false);
    }

    return cb(true, osVersionError);
  });
};

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
    args.push('-' + key, val);
  }

  return args;
}

, command = function (options, cb) {
  var notifyApp = exec(notifier + ' ' + options.join(' '), function (error, stdout, stderr) {
    if (error !== null) {
      return cb(error);
    }

    cb(stderr, stdout);
  }); 

  return notifyApp;
};

Notifier.prototype.notify = function (options, callback) {
    var argsList = constructArgumentList(options);
    callback = callback || function () {};

    if(this.isOSX) {
      command(argsList, callback);
      return this;
    }

    var self = this;
    isMacOSX(function (error, errorMsg) {
      if (error) {
        throw new Error(errorMsg);
      }
      command(argsList, callback);
      self.isOSX = true;
    });
    return this;
};


module.exports = new Notifier();