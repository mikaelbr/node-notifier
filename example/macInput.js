import { NotificationCenter } from '../index.js';

const nc = new NotificationCenter();

const trueAnswer = 'Most def.';

nc.notify(
  {
    title: 'Notifications',
    message: 'Are they cool?',
    sound: 'Funk',
    // case sensitive
    closeLabel: 'Absolutely not',
    actions: trueAnswer
  },
  (err, response, metadata) => {
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
      (err, response, metadata) => {
        if (err) throw err;
        console.log(metadata);
      }
    );
  }
);

nc.on('replied', (obj, options, metadata) => {
  console.log('User replied', metadata);
});
