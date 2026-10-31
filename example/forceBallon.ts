import { WindowsBalloon } from '../src/index.ts';

new WindowsBalloon()
  .notify({ message: 'Hello' }, (err, data) => {
    console.log(err, data);
  })
  .on('click', (...args) => {
    console.log(args);
  });
