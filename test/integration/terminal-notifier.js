const os = require('os');
const { NotificationCenter } = require('../../');

function notify(options) {
  return new Promise((resolve, reject) => {
    new NotificationCenter().notify(options, (err, response, metadata) =>
      err ? reject(err) : resolve({ response, metadata })
    );
  });
}

describe.runIf(os.type() === 'Darwin')(
  'terminal-notifier (integration)',
  () => {
    it('sends a notification without waiting', async () => {
      const { metadata } = await notify({
        title: 'node-notifier',
        message: 'integration test',
        timeout: false
      });
      expect(metadata).toEqual({});
    });

    it('reports delivery and timeout back from Notification Center', async () => {
      const { response, metadata } = await notify({
        title: 'node-notifier',
        message: 'integration test (timeout)',
        timeout: 1
      });
      expect(response).toBe('timeout');
      expect(metadata.activationType).toBe('timeout');
      expect(metadata.deliveredAt).toEqual(expect.any(String));
    });
  }
);
