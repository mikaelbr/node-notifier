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


// Kill codes:
  2 = Timeout
  3 = Clicked

 */
var path = require('path'),
    notifier = path.resolve(__dirname, '../../vendor/notifu/notifu'),
    utils = require('../utils'),
    checkGrowl = require('../checkGrowl'),
    Toaster = require('./toaster'),
    Growl = require('./growl');

var hasGrowl = void 0;

module.exports = WindowsBalloon;

function WindowsBalloon (options) {
  if (!(this instanceof WindowsBalloon)) {
    return new WindowsBalloon();
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

  var localCb = !!options.wait ? function (error, data) {
    var action = fromErrorCodeToAction(error.code);
    if (action === 'error') return callback(error, data);

    return callback(null, action);
  } : function () {};

  utils.windowsCommand(notifier, argsList, localCb);
  if (!options.wait) {
    callback();
  }
}

WindowsBalloon.prototype.notify = function (options, callback) {
  var fallback, notifierOptions = this.options;
  callback = callback || function (err, data) {};

  if (!!this.options.withFallback && utils.isWin8()) {
    fallback = fallback || new Toaster(notifierOptions);
    return fallback.notify(options, callback);
  }

  if (!!this.options.withFallback && (!utils.isLessThanWin8() || hasGrowl === true)) {
    fallback = fallback || new Growl(notifierOptions);
    return fallback.notify(options, callback);
  }

  if (!this.options.withFallback || hasGrowl === false) {
    doNotification(options, callback);
    return this;
  }

  checkGrowl(function (hasGrowlResult) {
    hasGrowl = hasGrowlResult;

    if (hasGrowl) {
      fallback = fallback || new Growl(notifierOptions);
      return fallback.notify(options, callback);
    }

    doNotification(options, callback);
  });

  return this;
};

function fromErrorCodeToAction (errorCode) {
  if (errorCode === 2) {
    return 'timeout';
  }
  if (errorCode === 3) {
    return 'activate';
  }
  return 'error';
}
