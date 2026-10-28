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
  let done = false;

  // Only the first outcome counts: an error after a successful connect would
  // otherwise call back a second time with the opposite answer.
  const finish = (hasGrowl) => {
    if (done) return;
    done = true;
    socket.end();
    cb(null, hasGrowl);
  };

  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
}
