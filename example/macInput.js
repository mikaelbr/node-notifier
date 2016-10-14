var notifier = require('../');
var nc = new notifier.NotificationCenter();

var trueAnswer = 'Most def.';

nc.notify({
  'title': 'Notifications',
  'message': 'Are they cool?',
  'sound': 'Funk', // case sensitive
  'closeLabel': 'Absolutely not',
  'actions': trueAnswer,
}, function (err, response) {
  if (response !== trueAnswer.toLocaleLowerCase()) {
    return; // No need to continue
  }

  nc.notify({
    'title': 'Notifications',
    'message': 'Do you want to reply to them?',
    'sound': 'Funk', // case sensitive
    'reply': true
  }, function () {
    console.log(arguments);
  });
});
