var notifier = require('../');
var nc = new notifier.NotificationCenter();

nc.notify({
  'title': 'Phil Coulson',
  'subtitle': 'Agent of S.H.I.E.L.D.',
  'message': 'If I come out, will you shoot me? \'Cause then I won\'t come out.',
  'sound': 'Funk', // case sensitive
  'appIcon': __dirname + '/coulson.jpg',
  'contentImage': __dirname + '/coulson.jpg',
  'open': 'file://' + __dirname + '/coulson.jpg'
});
