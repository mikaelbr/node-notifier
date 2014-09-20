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
    Toaster = require('./toaster'),
    Growl = require('./growl');

var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }

  this.options = options;
};

var allowedArguments = ["t", "d", "p", "m", "i", "e", "q", "w", "xp"];

Notifier.prototype.notify = function (options, callback) {
  var fallback;
  options.title = options.title || 'Node Notification:';
  callback = callback || function (err, data) {};

  if (utils.isWin8()) {
    fallback = new Toaster(this.options);
    return fallback.notify(options, callback);
  }

  if (!utils.isLessThanWin8()) {
    fallback = new Growl(this.options);
    return fallback.notify(options, callback);
  }

  options = utils.mapToNotifu(options);

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  var argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true,
    allowedArguments: allowedArguments
  });
  utils.windowsCommand(notifier, argsList, callback);
  return this;
};

module.exports = Notifier;