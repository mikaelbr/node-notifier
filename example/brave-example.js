/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, esversion: 6 */

const notifier = require('../index');
const os = require('os');

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
      if (notifier.utils.isMountainLion())
        return { closeLabel: 'Dismiss', actions: 'View' };
    },

    Windows_NT: () => {
      if (!notifier.utils.isLessThanWin8())
        return { appID: 'com.squirrel.brave.Brave' };
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

    report(null, result);
  });

  return true;
};

example('Title', 'Message...', null, (err, result) => {
  console.log(
    'err=' + (err && err.toString()) + ' result=' + JSON.stringify(result)
  );
});
