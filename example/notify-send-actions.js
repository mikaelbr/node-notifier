import { NotifySend } from '../index.js';

// Requires notify-send (libnotify) 0.7.10 or newer and a notification daemon
// that supports actions.
const notifier = new NotifySend();

notifier.notify(
  {
    title: 'node-notifier',
    message: 'Are you sure you want to continue?',
    actions: ['OK', 'Cancel'],
    timeout: 30
  },
  (err, response, metadata) => {
    if (err) throw err;
    console.log(JSON.stringify({ response, metadata }, null, 2));
  }
);

notifier.on('click', (notifierObject, options, metadata) => {
  console.log(`"${metadata.activationValue}" was pressed`);
});

notifier.on('timeout', () => {
  console.log('Timed out!');
});
