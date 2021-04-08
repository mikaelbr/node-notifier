// All notifiers
var NotifySend = require('./notifiers/notifysend');
var NotificationCenter = require('./notifiers/notificationcenter');
var WindowsToaster = require('./notifiers/toaster');
var Growl = require('./notifiers/growl');
var WindowsBalloon = require('./notifiers/balloon');

var options = { withFallback: true };

function getOsType () {
  var utils = require('./lib/utils');
  var osType = require('os').type();

  if (osType.match(/BSD$/)) {
    osType === 'BSD';
  } else if (osType === 'Windows_NT' && utils.isLessThanWin8()) {
    osType === 'Windows_7_and_Below';
  } else if (utils.isWSL()) {
    osType = 'WSL';
  }

  return osType.toLowerCase();
}

var osMap = {
  bsd: NotifySend,
  darwin: NotificationCenter,
  linux: NotifySend,
  windows_7_and_below: WindowsBalloon,
  windows_nt: WindowsToaster,
  wsl: WindowsToaster
};

var osNotifier = osMap[getOsType()] || Growl;

// Set the notifier specific to the current OS
module.exports = new osNotifier(options);
module.exports.Notification = osNotifier;

// Expose notifiers to give full control.
module.exports.NotifySend = NotifySend;
module.exports.NotificationCenter = NotificationCenter;
module.exports.WindowsToaster = WindowsToaster;
module.exports.WindowsBalloon = WindowsBalloon;
module.exports.Growl = Growl;
