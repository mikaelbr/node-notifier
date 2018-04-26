/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, esversion: 6 */

const notifier = require('../index');
const exec = require('child_process').exec;
const os = require('os');
const path = require('path');

// perhaps move this inside the package...

const enabled = cb => {
  let f = {
    Darwin: () => {
      if (!notifier.utils.isMountainLion()) return;

      exec(
        'defaults -currentHost read ~/Library/Preferences/ByHost/com.apple.notificationcenterui',
        (err, stdout, stderr) => {
          if (err) return cb(err, stderr);

          return cb(null, stdout.indexOf('doNotDisturb = 0;') !== -1);
        }
      );

      return true;
    },

    Windows_NT: () => {
      if (!notifier.utils.isLessThanWin8()) return;

      cb(null, true);

      return true;
    }
  }[os.type()];

  if (!f || !f()) setImmediate(cb);
};

enabled((err, result) => {
  if (err) return console.log('enabled: err=' + err.toString());

  console.log('enabled: result=' + JSON.stringify(result));
});

const example = (title, message, idle, callback) => {
  const type = os.type();

  const report = (err, result) => {
    if (callback) return callback(err, result);

    console.log('returning ' + JSON.stringify((!err && result) || err));
    return (!err && result) || err;
  };

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
      if (notifier.utils.isMountainLion()) {
        return { actions: 'Open', closeLabel: 'Close' };
      }
    },

    Windows_NT: () => {
      if (!notifier.utils.isLessThanWin8()) {
        return {
          appID: 'com.squirrel.brave.Brave',
          icon: path.join(__dirname, 'BAT_icon.png')
        };
      }
    }
  }[type];
  if (extras) extras = extras();
  if (!extras) return report(new Error('notifications not supported'));

  notifier.notify(Object.assign(options, extras), function() {
    let result = arguments[2] && arguments[2].activationType;

    if (!result && arguments[1]) {
      result = {
        'the user clicked on the toast.': 'contentsClicked',
        'the toast has timed out': 'timeout',
        'the user dismissed this toast': 'closed'
      }[arguments[1]];
    }
    if (!result) result = 'unknown';
    if (result.indexOf('Clicked') !== -1) result = 'clicked';
    if (result === 'timeout') result = 'ignored';

    console.log(require('json-stringify-safe')(arguments, null, 2));
    report(null, result);
  });

  return true;
};

example('Title', 'Message...', null, (err, result) => {
  console.log(
    'err=' + (err && err.toString()) + ' result=' + JSON.stringify(result)
  );
});
