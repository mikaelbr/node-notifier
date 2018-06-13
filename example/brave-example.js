/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, esversion: 6 */

const notifier = require('../index');
const os = require('os');
const path = require('path');

const osType = os.type();
const appID =
  osType === 'Darwin'
    ? 'com.brave.terminal-notifier'
    : 'com.squirrel.brave.Brave';

console.log('available: result=' + JSON.stringify(notifier.available()));
notifier.configured(appID, (err, result) => {
  console.log(
    'configured: err=' +
      (err && err.toString()) +
      ' result=' +
      JSON.stringify(result)
  );
});
notifier.enabled(appID, (err, result) => {
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

  if (!notifier.available()) {
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

  notifier.notify(Object.assign(options, extras || {}), function() {
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
