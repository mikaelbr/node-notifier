var notifier = require('../index');

notifier
  .notify({
    'message': 'Hello',
    'wait': true
  }, function (err, data) {
    // Will also wait until notification is closed.
    console.log('Waited');
    console.log(err, data);
  })
  .on('click', function () {
    console.log(arguments);
  });
