var os = require('os');
var notifier = (os.type() === 'Linux') ? 'notify-send' : 'terminal-notifier';
module.exports = require('./lib/' + notifier);
