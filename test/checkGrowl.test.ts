import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import checkGrowl from '../src/lib/checkGrowl.ts';

interface CheckResult {
  err: null;
  hasGrowl: boolean;
  cb: Mock<(err: null, hasGrowl: boolean) => void>;
}

function check(config: { host?: string; port?: number }) {
  return new Promise<CheckResult>((resolve) => {
    const cb: CheckResult['cb'] = vi.fn((err: null, hasGrowl: boolean) =>
      resolve({ err, hasGrowl, cb })
    );
    checkGrowl(config, cb);
  });
}

describe('checkGrowl', function () {
  afterEach(function () {
    vi.restoreAllMocks();
  });

  it('should report growl when the port accepts connections', async function () {
    const server = net.createServer((socket) => socket.end());
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const { port } = server.address() as net.AddressInfo;

    const { err, hasGrowl } = await check({ host: '127.0.0.1', port });
    server.close();

    expect(err).toBeNull();
    expect(hasGrowl).toBe(true);
  });

  it('should report no growl when the connection is refused', async function () {
    const server = net.createServer();
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve)
    );
    const { port } = server.address() as net.AddressInfo;
    await new Promise((resolve) => server.close(resolve));

    const { hasGrowl } = await check({ host: '127.0.0.1', port });

    expect(hasGrowl).toBe(false);
  });

  it('should still report growl when connecting takes longer than the socket timeout', async function () {
    const socket = Object.assign(new EventEmitter(), {
      setTimeout: vi.fn(),
      end: vi.fn()
    });
    vi.spyOn(net, 'connect').mockReturnValue(socket as unknown as net.Socket);
    setTimeout(() => socket.emit('connect'), 150);

    const { hasGrowl } = await check({ host: '127.0.0.1' });

    expect(hasGrowl).toBe(true);
  });

  it('should only call back once when an error follows the connect', async function () {
    const socket = Object.assign(new EventEmitter(), {
      setTimeout: vi.fn(),
      end: vi.fn()
    });
    vi.spyOn(net, 'connect').mockReturnValue(socket as unknown as net.Socket);
    setImmediate(() => socket.emit('connect'));

    const { hasGrowl, cb } = await check({ host: '127.0.0.1' });
    socket.emit('error', new Error('ECONNRESET'));

    expect(hasGrowl).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
