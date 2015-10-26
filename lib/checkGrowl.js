var net = require('net');

var hasGrowl = false;

module.exports = function (growlConfig, cb) {
  if (typeof cb == 'undefined') {
    cb = growlConfig;
    growlConfig = {
      port: 23053,
      host: 'localhost'
    };
  }
  if (hasGrowl) return cb(hasGrowl);
  var socket = net.connect(growlConfig.port, growlConfig.host);
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
