var notifier = require('../');

describe('constructors', function() {
  it('should expose a default selected instance', function() {
    expect(notifier.notify).toBeTruthy();
  });

  it('should expect only a function callback as second parameter', function() {
    function cb() {}
    expect(notifier.notify({ title: 'My notification' }, cb)).toBeTruthy();
  });

  it('should throw error when second parameter is not a function', async () => {
    var wrongParamOne = 200;
    var wrongParamTwo = 'meaningless string';
    var data = { title: 'My notification' };

    var base = notifier.notify.bind(notifier, data);
    await expect(base.bind(notifier, wrongParamOne)()).rejects.toThrowError(
      /^The second argument/
    );
    await expect(base.bind(notifier, wrongParamTwo)()).rejects.toThrowError(
      /^The second argument/
    );
  });

  it('should expose a default selected constructor function', function() {
    expect(notifier).toBeInstanceOf(notifier.Notification);
  });

  it('should expose constructor for WindowsBalloon', function() {
    expect(notifier.WindowsBalloon).toBeTruthy();
  });

  it('should expose constructor for WindowsToaster', function() {
    expect(notifier.WindowsToaster).toBeTruthy();
  });

  it('should expose constructor for NotifySend', function() {
    expect(notifier.NotifySend).toBeTruthy();
  });

  it('should expose constructor for Growl', function() {
    expect(notifier.Growl).toBeTruthy();
  });
});
