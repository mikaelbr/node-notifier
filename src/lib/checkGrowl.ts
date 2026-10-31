import net from 'node:net';

interface GrowlConfig {
  host?: string | undefined;
  port?: number | undefined;
}

type CheckGrowlCallback = (err: null, hasGrowl: boolean) => void;

export default function checkGrowl(cb: CheckGrowlCallback): void;
export default function checkGrowl(
  growlConfig: GrowlConfig,
  cb: CheckGrowlCallback
): void;
export default function checkGrowl(
  growlConfig: GrowlConfig | CheckGrowlCallback,
  cb?: CheckGrowlCallback
): void {
  if (typeof growlConfig === 'function') {
    cb = growlConfig;
    growlConfig = {};
  }
  const callback = cb as CheckGrowlCallback;
  const port = growlConfig.port || 23053;
  const host = growlConfig.host || 'localhost';
  const socket = net.connect(port, host);
  socket.setTimeout(100);
  let done = false;

  // Only the first outcome counts: an error after a successful connect would
  // otherwise call back a second time with the opposite answer.
  const finish = (hasGrowl: boolean) => {
    if (done) return;
    done = true;
    socket.end();
    callback(null, hasGrowl);
  };

  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
}
