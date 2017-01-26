var notifier = require('../index');
var path = require('path');

notifier.notify(
  {
    message: 'Hello. This is a longer text\nWith "some" newlines.',
    wait: true,
    icon: path.join(__dirname, 'coulson.jpg'),
    sound: true
  },
  function(err, data) {
    // Will also wait until notification is closed.
    console.log('Waited');
    console.log(err, data);
  }
);

notifier.on('timeout', function() {
  console.log('Timed out!');
});

notifier.on('click', function() {
  console.log('Clicked!');
});
