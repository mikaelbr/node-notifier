import path from 'node:path';
import { WindowsToaster } from '../index.js';

const customPath = path.join(
  import.meta.dirname,
  'resources',
  'snoretoast-x64.exe'
);
const notifierOptions = { withFallback: false, customPath };
const notifier = new WindowsToaster(notifierOptions);

notifier.notify(
  {
    message: 'Hello!',
    icon: path.join(import.meta.dirname, 'resources', 'coulson.jpg'),
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
