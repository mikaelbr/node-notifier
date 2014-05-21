/**
 * A Node.js wrapper for terminal-notify.
 *
 * Requirements:
 *  - Mac OS X 10.8
 */

var path = require('path')
  , utils = require('../utils');

var Notifier = function () {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  this.isOSX = false;
}
, cbAnnotator = function (cb) {
  return function (err, data) {
    cb(err, utils.parseCLIOutput(data));
  };
};

Notifier.prototype.useNotifier = function (callback) {
  var notifier = 'terminal-notifier';

  return utils.commandPresent(notifier, function (present) {
    if (!present) {
      notifier = path.resolve(__dirname, '../../vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier');
    }

    return callback(notifier);
  });
};

Notifier.prototype.notify = function (options, callback) {
    var argsList = utils.constructArgumentList(options);
    callback = cbAnnotator(callback || function (err, data) {});

    var self = this;
    this.useNotifier( function (notifier) {
      if(self.isOSX) {
        utils.command(notifier, argsList, callback);
        return self;
      }


      utils.isMacOSX(function (error, errorMsg) {
        if (error) {
          return callback(new Error(errorMsg));
        }
        utils.command(notifier, argsList, callback);
        self.isOSX = true;
      });
    });
    return this;
};

module.exports = Notifier;
