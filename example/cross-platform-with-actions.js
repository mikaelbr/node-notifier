const notifier = require('../');
const replyAnswer = 'Let me reply';
const quitAnswer = 'Exit';

notifier.notify(
  {
    title: 'Notifications',
    closeLabel: 'Close',
    message: 'Testing input through buttons and textbox',
    timeout: 10,
    actions: [replyAnswer, quitAnswer]
  },
  (err, data, metadata) => {
    console.log(
      'Callback from initial notification: Err: ',
      err,
      '\ndata: ',
      data,
      '\nmetadata: ',
      metadata
    );
    if (err || !metadata) {
      return;
    }
    if (metadata.activationValue === 'Close') {
      console.log('Close button activated');
      return;
    }
    if (metadata.activationValue === quitAnswer) {
      console.log('Exit button activated');
      return;
    }
    if (metadata.activationValue === replyAnswer) {
      console.log('Let me reply button activated');
      notifier.notify(
        {
          title: 'Notifications',
          message: 'So you want to reply?',
          sound: 'Funk',
          // case sensitive
          reply: true
        },
        function(err, data, metadata) {
          if (err) throw err;
          console.log(
            'Callback from reply notification: Err: ',
            err,
            '\ndata: ',
            data,
            '\nmetadata: ',
            metadata
          );
        }
      );
    }
  }
);
// Built-in actions:
notifier.on('timeout', () => {
  console.log('Event listener: Timed out!');
});
notifier.on('click', () => {
  console.log('Event listener: Clicked!');
});
notifier.on('dismissed', () => {
  console.log('Event listener: Dismissed!');
});

// Buttons actions (windows toaster only, lower-cased):
notifier.on('exit', () => {
  console.log('Event listener: "Exit" was pressed');
});
notifier.on('let me reply', () => {
  console.log('Event listener: "Let me reply" was pressed');
});

notifier.on('replied', function(obj, options, metadata) {
  console.log('Event listener: User replied event', metadata);
});
