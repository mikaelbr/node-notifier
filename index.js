const exec = require('child_process').exec;
var os = require('os');
const plist = require('plist');
const underscore = require('underscore');

var utils = require('./lib/utils');

const osType = os.type();

// All notifiers
var NotifySend = require('./notifiers/notifysend');
var NotificationCenter = require('./notifiers/notificationcenter');
var WindowsToaster = require('./notifiers/toaster');
var Growl = require('./notifiers/growl');
var WindowsBalloon = require('./notifiers/balloon');

var options = { withFallback: true };

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
  default:
    if (osType.match(/BSD$/)) {
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

module.exports.utils = utils;

const available = () => {
  let f = {
    Darwin: () => {
      return utils.isMountainLion();
    },

    Windows_NT: () => {
      return !utils.isLessThanWin8();
    }
  }[osType];

  return (f && f()) || false;
};

const configured = (appID, callback) => {
  let result = available();

  if (!result) return callback(null, result);

  let f = {
    Darwin: () => {
      exec('launchctl list', (err, stdout, stderr) => {
        if (!err && stdout.indexOf('com.apple.notificationcenterui') === -1) {
          return callback(null, false);
        }

        exec('defaults export com.apple.ncprefs -', (err, stdout, stderr) => {
          let data, entry;

          if (err) return callback(err, stderr);

          data = plist.parse(stdout);
          entry = underscore.findWhere(data && data.apps, {
            'bundle-id': appID
          });
          callback(null, !!(entry.flags & (1 << 4)));
        });
      });
    },

    Windows_NT: () => {
      return callback(null, true);
    }
  }[osType];

  if (!f) return callback(null, false);
  f();
};

const enabled = (appID, callback) => {
  configured(appID, (err, result) => {
    if (err) return callback(err, result);

    let f = {
      Darwin: () => {
        exec(
          'defaults -currentHost export com.apple.notificationcenterui -',
          (err, stdout, stderr) => {
            if (err) return callback(err, stderr);

            return callback(null, plist.parse(stdout).doNotDisturb !== true);
          }
        );
      },

      Windows_NT: () => {
        return callback(null, true);
      }
    }[osType];

    if (!f) return callback(null, false);
    f();
  });
};

module.exports.available = available;
module.exports.configured = configured;
module.exports.enabled = enabled;
