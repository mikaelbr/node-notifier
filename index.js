const exec = require('child_process').exec;
var os = require('os');
const path = require('path');
const plist = require('plist');
const underscore = require('underscore');

var utils = require('./lib/utils');

const osType = os.type();
const defID =
  osType === 'Darwin'
    ? 'com.brave.terminal-notifier'
    : 'com.squirrel.brave.Brave';

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

  if (!callback && typeof appID === 'function') {
    callback = appID;
    appID = defID;
  }
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
          callback(null, entry && !!(entry.flags & (1 << 4)));
        });
      });
    },

    Windows_NT: () => {
      module.exports.notify({ n: appID }, function() {
        return callback(null, arguments[1] === 'enabled');
      });
    }
  }[osType];

  if (!f) return callback(null, false);
  f();
};

const enabled = (appID, callback) => {
  if (!callback && typeof appID === 'function') {
    callback = appID;
    appID = defID;
  }
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
        module.exports.notify({ k: true }, function() {
          return callback(null, arguments[1] === 'enabled');
        });
      }
    }[osType];

    if (!f) return callback(null, false);
    f();
  });
};

const inform = (title, message, idle, appID, callback) => {
  const report = (err, result) => {
    if (callback) return callback(err, result);

    return (!err && result) || err;
  };

  if (!callback && typeof appID === 'function') {
    callback = appID;
    appID = defID;
  }

  if (!available()) {
    return report(new Error('notifications not supported'));
  }

  if (!title) return report(new Error('missing parameter: title'));

  if (!message) return report(new Error('missing parameter: message'));

  let options = {
    title: title,
    message: message,
    sound: true,
    wait: true,
    timeout: idle || 15
  };

  let extras = {
    Linux: () => {
      // TBD: add NotifySend() options here
    },

    // Terminal.icns has been updated!
    Darwin: () => {
      return { actions: 'Open', closeLabel: 'Close' };
    },

    Windows_NT: () => {
      return {
        appID: appID,
        icon: path.join(__dirname, 'BAT_icon.png')
      };
    }
  }[osType];
  if (extras) extras = extras();

  module.exports.notify(Object.assign(options, extras || {}), function() {
    let result = arguments[2] && arguments[2].activationType;

    if (!result && arguments[1]) {
      result = {
        'the user clicked on the toast.': 'contentsClicked',
        'the user activated the notification': 'contentsClicked',
        'the toast has timed out': 'timeout',
        'the notification has timed out.': 'timeout',
        'the user dismissed this toast': 'closed',
        'the user dismissed the notification.': 'closed'
      }[arguments[1]];
    }
    if (!result) result = 'unknown';
    if (result.indexOf('Clicked') !== -1) result = 'clicked';
    if (result === 'timeout') result = 'ignored';

    report(null, result);
  });

  return true;
};

module.exports.available = available;
module.exports.configured = configured;
module.exports.enabled = enabled;
module.exports.inform = inform;
