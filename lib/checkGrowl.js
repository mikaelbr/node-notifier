const net = require('net');

const hasGrowl = false;
module.exports = function(growlConfig, cb) {
  if (typeof cb === 'undefined') {
    cb = growlConfig;
    growlConfig = {};
  }
  if (hasGrowl) return cb(null, hasGrowl);
  const port = growlConfig.port || 23053;
  const host = growlConfig.host || 'localhost';
  const socket = net.connect(port, host);
  socket.setTimeout(100);

  socket.once('connect', function() {
    socket.end();
    cb(null, true);
  });

  socket.once('error', function() {
    socket.end();
    cb(null, false);
  });
};
