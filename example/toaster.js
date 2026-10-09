import path from 'node:path';
import notifier from '../index.js';

notifier.notify(
  {
    message: 'Hello. This is a longer text\nWith "some" newlines.',
    icon: path.join(import.meta.dirname, 'coulson.jpg'),
    sound: true
  },
  (err, data) => {
    // Will also wait until notification is closed.
    console.log('Waited');
    console.log(JSON.stringify({ err, data }));
  }
);

notifier.on('timeout', () => {
  console.log('Timed out!');
});

notifier.on('click', () => {
  console.log('Clicked!');
});
