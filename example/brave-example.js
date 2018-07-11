/* jshint asi: true, node: true, laxbreak: true, laxcomma: true, undef: true, esversion: 6 */

const notifier = require('../index');

console.log('available: result=' + JSON.stringify(notifier.available()));

const pp = (what, err, result) => {
  console.log(
    what +
      ': err=' +
      (err && err.toString()) +
      ' result=' +
      JSON.stringify(result)
  );
};

notifier.configured((err, result) => {
  pp('configured', err, result);

  notifier.enabled((err, result) => {
    pp('enabled', err, result);

    notifier.inform('Title', 'Message...', null, (err, result) => {
      pp('inform', err, result);
    });
  });
});
