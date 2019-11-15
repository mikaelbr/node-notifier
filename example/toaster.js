const notifier = require('../index');
const path = require('path');

notifier.notify(
  {
    message: 'Hello. This is a longer text\nWith "some" newlines.',
    icon: path.join(__dirname, 'coulson.jpg'),
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
