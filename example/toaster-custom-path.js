const { WindowsToaster } = require('../');
const path = require('path');

const customPath = path.join(__dirname, 'resources', 'snoretoast-x64.exe');
const notifierOptions = { withFallback: false, customPath };
const notifier = new WindowsToaster(notifierOptions);

notifier.notify(
  {
    message: 'Hello!',
    icon: path.join(__dirname, 'resources', 'coulson.jpg'),
    sound: true
  },
  function(err, data) {
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
