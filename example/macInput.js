var notifier = require('../');
var nc = new notifier.NotificationCenter();

var trueAnswer = 'Most def.';

nc.notify(
  {
    title: 'Notifications',
    message: 'Are they cool?',
    sound: 'Funk',
    // case sensitive
    closeLabel: 'Absolutely not',
    actions: trueAnswer
  },
  function(err, response, metadata) {
    if (err) throw err;
    console.log(metadata);

    if (metadata.activationValue !== trueAnswer) {
      return; // No need to continue
    }

    nc.notify(
      {
        title: 'Notifications',
        message: 'Do you want to reply to them?',
        sound: 'Funk',
        // case sensitive
        reply: true
      },
      function(err, response, metadata) {
        if (err) throw err;
        console.log(metadata);
      }
    );
  }
);

nc.on('replied', function(obj, options, metadata) {
  console.log('User replied', metadata);
});
