const os = require('os');
const utils = require('./lib/utils');

// All notifiers
const NotifySend = require('./notifiers/notifysend');
const NotificationCenter = require('./notifiers/notificationcenter');
const WindowsToaster = require('./notifiers/toaster');
const Growl = require('./notifiers/growl');
const WindowsBalloon = require('./notifiers/balloon');

const options = { withFallback: true };

const osType = utils.isWSL() ? 'WSL' : os.type();

switch (osType) {
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
  case 'WSL':
    module.exports = new WindowsToaster(options);
    module.exports.Notification = WindowsToaster;
    break;
  default:
    if (os.type().match(/BSD$/)) {
      module.exports = new NotifySend(options);
      module.exports.Notification = NotifySend;
    } else {
      module.exports = new Growl(options);
      module.exports.Notification = Growl;
    }
}

// Expose notifiers to give full control.
module.exports.NotifySend = NotifySend;
module.exports.NotificationCenter = NotificationCenter;
module.exports.WindowsToaster = WindowsToaster;
module.exports.WindowsBalloon = WindowsBalloon;
module.exports.Growl = Growl;
