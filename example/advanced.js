import path from 'node:path';
import { NotificationCenter } from '../index.js';

const nc = new NotificationCenter();
const image = path.join(import.meta.dirname, 'coulson.jpg');

nc.notify(
  {
    title: 'Phil Coulson',
    subtitle: 'Agent of S.H.I.E.L.D.',
    message: "If I come out, will you shoot me? 'Cause then I won't come out.",
    sound: 'Funk',
    // case sensitive
    wait: true,
    icon: image,
    contentImage: image,
    open: `file://${image}`
  },
  (...args) => {
    console.log(args);
  }
);
