var net = require('net')

var hasGrowl = false;
var port = 23053;

module.exports = function (cb) {
  if (hasGrowl) return cb(hasGrowl);
  var socket = net.connect(port);
  socket.setTimeout(100);

  socket.on('connect', function() {
    cb(true);
  });

  socket.on('error', function() {
    cb(false);
  });
};