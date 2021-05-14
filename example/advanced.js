const notifier = require('../');
const nc = new notifier.NotificationCenter();
const path = require('path');

nc.notify(
  {
    title: 'Phil Coulson',
    subtitle: 'Agent of S.H.I.E.L.D.',
    message: "If I come out, will you shoot me? 'Cause then I won't come out.",
    sound: 'Funk',
    // case sensitive
    wait: true,
    icon: path.join(__dirname, 'coulson.jpg'),
    contentImage: path.join(__dirname, 'coulson.jpg'),
    open: 'file://' + path.join(__dirname, 'coulson.jpg')
  },
  function() {
    console.log(arguments);
  }
);
