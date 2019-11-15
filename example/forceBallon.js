const notifier = require('../index');
const balloon = notifier.WindowsBalloon();
balloon
  .notify({ message: 'Hello' }, function(err, data) {
    console.log(err, data);
  })
  .on('click', function() {
    console.log(arguments);
  });
