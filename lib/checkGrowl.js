var net = require('net');

var hasGrowl = false;

module.exports = function (growlConfig, cb) {
  if (typeof cb == 'undefined') {
    cb = growlConfig;
    growlConfig = {};
  }
  if (hasGrowl) return cb(hasGrowl);
  port = growlConfig.port || 23053;
  host = growlConfig.host || 'localhost';
  var socket = net.connect(port, host);
  socket.setTimeout(100);

  socket.on('connect', function() {
    socket.end();
    cb(true);
  });

  socket.on('error', function() {
    socket.end();
    cb(false);
  });
};
