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


var errorMessageOsX = 'You need Mac OS X 10.8 or above to use NotificationCenter,' +
                        ' or use Growl fallback with constructor option {withFallback: true}.';

var isOSX = utils.isMountainLion(), fallbackNotifier = null;


module.exports = NotificationCenter;

function NotificationCenter (options) {
  if (!(this instanceof NotificationCenter)) {
    return new NotificationCenter(options);
  }
  this.options = options;
}

NotificationCenter.prototype.notify = function (options, callback) {
  options = utils.mapToMac(options);
  if (!!options.wait) {
    options.wait = 'YES';
  }

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  var argsList = utils.constructArgumentList(options);
  callback = callback || function (err, data) {};

  if(isOSX) {
    utils.command(notifier, argsList, callback);
    return this;
  }

  if(fallbackNotifier) {
    fallbackNotifier.notify(options, callback);
    return this;
  }

  if (fallbackNotifier || !!this.options.withFallback) {
    fallbackNotifier = fallbackNotifier || new Growl(this.options);
    return fallbackNotifier.notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
};
