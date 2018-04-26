/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, esversion: 6 */

const notifier = require('../index');
const os = require('os');
const path = require('path');

const osType = os.type();

notifier.available((err, result) => {
  console.log(
    'available: err=' +
      (err && err.toString()) +
      ' result=' +
      JSON.stringify(result)
  );
});
notifier.configured((err, result) => {
  console.log(
    'configured: err=' +
      (err && err.toString()) +
      ' result=' +
      JSON.stringify(result)
  );
});
notifier.enabled((err, result) => {
  console.log(
    'enabled: err=' +
      (err && err.toString()) +
      ' result=' +
      JSON.stringify(result)
  );
});

const example = (title, message, idle, callback) => {
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
  }[osType];
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

    console.log(
      'arguments: ' + require('json-stringify-safe')(arguments, null, 2)
    );
    report(null, result);
  });

  return true;
};

example('Title', 'Message...', null, (err, result) => {
  console.log(
    'err=' + (err && err.toString()) + ' result=' + JSON.stringify(result)
  );
});
