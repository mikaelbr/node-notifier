var os = require('os');
var utils =  require('./lib/utils');

// All notifiers
var NotifySend = require('./lib/notifiers/notify-send');
var NotificationCenter = require('./lib/notifiers/terminal-notifier');
var WindowsToaster = require('./lib/notifiers/toaster');
var Growl =  require('./lib/notifiers/growl');
var WindowsBalloon =  require('./lib/notifiers/balloon');

var options = { withFallback: true };

switch(os.type()) {
  case 'Linux':
    module.exports = new NotifySend(options);
    module.exports.Notification = NotifySend;
    break;
  case 'Darwin':
    module.exports = new NotificationCenter(options);
    module.exports.Notification = NotificationCenter;
    break;
  case 'Windows_NT':
    if (utils.isLessThanWin8()) {
      module.exports = new WindowsBalloon(options);
      module.exports.Notification = WindowsBalloon;
    } else {
      module.exports = new WindowsToaster(options);
      module.exports.Notification = WindowsToaster;
    }
    break;
  default:
    module.exports = new Growl(options);
    module.exports.Notification = Growl;
}

// Expose notifiers to give full control.
module.exports.NotifySend = NotifySend;
module.exports.NotificationCenter = NotificationCenter;
module.exports.WindowsToaster = WindowsToaster;
module.exports.WindowsBalloon = WindowsBalloon;
module.exports.Growl = Growl;
