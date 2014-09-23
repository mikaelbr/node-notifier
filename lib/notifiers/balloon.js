/**
 * Wrapper for the notifu 1.6 (http://www.paralint.com/projects/notifu/)

Usage
/t <value>      The type of message to display values are:
                    info      The message is an informational message
                    warn      The message is an warning message
                    error     The message is an error message
/d <value>      The number of milliseconds to display (omit or 0 for infinit)
/p <value>      The title (or prompt) of the ballon
/m <value>      The message text
/i <value>      Specify an icon to use ("parent" uses the icon of the parent process)
/e              Enable ballon tips in the registry (for this user only)
/q              Do not play a sound when the tooltip is displayed
/w              Show the tooltip even if the user is in the quiet period that follows his very first login (Windows 7 and up)
/xp             Use IUserNotification interface event when IUserNotification2 is available

 */
var path = require('path'),
    notifier = path.resolve(__dirname, '../../vendor/notifu/notifu'),
    utils = require('../utils'),
    checkGrowl = require('../checkGrowl'),
    Toaster = require('./toaster'),
    Growl = require('./growl');

var hasGrowl = void 0;

var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }

  this.options = options;
};

var allowedArguments = ["t", "d", "p", "m", "i", "e", "q", "w", "xp"];

var doNotification = function (options, callback) {
  options = utils.mapToNotifu(options);
  options.p = options.p || 'Node Notification:';

  if (!options.m) {
    callback(new Error('Message is required.'));
    return this;
  }

  var argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true,
    allowedArguments: allowedArguments
  });
  utils.windowsCommand(notifier, argsList, callback);
}

Notifier.prototype.notify = function (options, callback) {
  var fallback, notifierOptions = this.options;
  callback = callback || function (err, data) {};

  if (utils.isWin8()) {
    fallback = new Toaster(notifierOptions);
    return fallback.notify(options, callback);
  }

  if (!utils.isLessThanWin8() || hasGrowl === true) {
    fallback = new Growl(notifierOptions);
    return fallback.notify(options, callback);
  }

  if (hasGrowl === false) {
    doNotification(options, callback);
    return this;
  }

  checkGrowl(function (hasGrowlResult) {
    hasGrowl = hasGrowlResult;

    if (hasGrowl) {
      fallback = new Growl(notifierOptions);
      return fallback.notify(options, callback);
    }

    doNotification(options, callback);
  });

  return this;
};

module.exports = Notifier;