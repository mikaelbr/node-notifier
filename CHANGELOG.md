Changelog
===

### `v4.1.0`
1. Adds support for changing host and port for Growl.

### `v4.0.3`
1. Fixes Notification center issue with multiple callback events.
2. Fixes error in source code: Fixes long-spaces to proper spaces

### `v4.0.2`
1. Fixes issue with immidiate notifu notifications (with `wait : false`)
2. Fixes issue with boolean flags for notifu.
3. Restructures directories. Making it easier to require notifiers directly.

### `v4.0.1`
1. Fixes issue with optional callback for notify-send

### `v4.0.0`
Major changes and breaking API.
1. require('node-notifier') now returns an instance with fallbackable notifications.
```js
var notifier = require('node-notifier');
notifier.notify();
```
2. Introduced a `wait` property (default `false`), to get user input for
Notification Center, Windows Toaster, Windows Balloons and Growl. Sadly not
for notify-send.
```js
var notifier = require('node-notifier');
notifier.notify({ wait: true }, function (err, response) {
     // response is response after user have interacted
     // with the notification or the notification has timed out.
});
```
3. All notification instances are now event emitters, emitting events
`click` or `timeout`. This is only applicable if `{ wait: true }`.
```js
var notifier = require('node-notifier');
notifier.on('click', function (notificationObject, options) {
     // options.someArbitraryData === 'foo'
});
notifier.notify({ wait: true, someArbitraryData: 'foo' });
```
4. WindowsToaster and NotificationCenter now can have sounds by doing `{ sound: true }`.
Default NotificationCenter sound is Bottle. Can still use define sound on
Mac:
```js
var notifier = require('node-notifier');
notifier.notify({ sound: true });
// For mac (same as sound: true on Windows 8)
notifier.notify({ sound: 'Morse' });
```

### `v3.4.0`
1. Adds Growl as priority over Balloons

### `v3.3.0`
1. Adds support for native Windows 7 and earlier (through task bar balloons)
2. Changes growl implementation. Adds better support for GNTP

### `v3.2.1`
1. Fixes support for notifications from folders with spaces on Windows.

### `v3.2.0`
1. Adds native Windows 8 support.

### `v3.1.0`
1. Adds Growl as fallback for Mac OS X pre 10.8.

### `v3.0.6`
1. Fixes typo: Changes Growl app name from `Gulp` to `Node`.

### `v3.0.5`
1. Maps common options between the different notifiers. Allowing for common usage with different notifiers.

### `v3.0.4`
1. Fixes expires for notify-send (Issue #13)

### `v3.0.2`
1. Fixes version check for Mac OS X Yosemite

### `v3.0.0`
1. Updates terminal-notifier to version 1.6.0; adding support for appIcon and contentImage
2. Removes parsing of output sent from notifier (Notification Center)
