var os = require('os');
var send = require('./lib/notifiers/notify-send');
var mac = require('./lib/notifiers/terminal-notifier');
var win8 = require('./lib/notifiers/toaster');
var growl =  require('./lib/notifiers/growl');
var balloon =  require('./lib/notifiers/balloon');
var utils =  require('./lib/utils');

switch(os.type()) {
  case 'Linux':
    module.exports = send;
    break;
  case 'Darwin':
    module.exports = mac;
    break;
  case 'Windows_NT':
    if (utils.isLessThanWin8()) {
      module.exports = balloon;
    } else {
      module.exports = win8;
    }
    break;
  default:
    module.exports = growl;
}

module.exports.NotifySend = send;
module.exports.NotificationCenter = mac;
module.exports.WindowsToaster = win8;
module.exports.WindowsBalloon = balloon;
module.exports.Growl = growl;
