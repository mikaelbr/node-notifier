import notifier from '../index.js';

notifier
  .notify({ message: 'Hello', wait: true }, (err, data) => {
    // Will also wait until notification is closed.
    console.log('Waited');
    console.log(err, data);
  })
  .on('click', (...args) => {
    console.log(args);
  });
