var os = require('os');
var send = require('./lib/notifiers/notify-send');
var mac = require('./lib/notifiers/terminal-notifier');
var growl =  require('./lib/notifiers/growl');

switch(os.type()) {
  case 'Linux':
    module.exports = send;
    break;
  case 'Darwin':
    module.exports = mac;
    break;
  default:
    module.exports = growl;
}

module.exports.NotifySend = send;
module.exports.NotificationCenter = mac;
module.exports.Growl = growl;
