import net from 'node:net';

export default function checkGrowl(growlConfig, cb) {
  if (cb === undefined) {
    cb = growlConfig;
    growlConfig = {};
  }
  const port = growlConfig.port || 23053;
  const host = growlConfig.host || 'localhost';
  const socket = net.connect(port, host);
  socket.setTimeout(100);

  socket.once('connect', () => {
    socket.end();
    cb(null, true);
  });

  socket.once('error', () => {
    socket.end();
    cb(null, false);
  });
}
