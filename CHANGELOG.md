Changelog
===

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
