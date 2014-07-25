# node-notifier [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

A node module for sending notification using node. Uses terminal-notifier on mac,
notify-send for Linux and growl for others.

For mac this is a wrapper for the
[terminal-notifier](https://github.com/alloy/terminal-notifier) application by
[Eloy Durán](https://github.com/alloy).

## Requirements
- Mac OS X (>= 10.8. If earlier versions, Growl is used as fallback)
- Linux with the notify-send module
- Or Growl on Windows

If using Linux, `notify-send` must be installed on your system.
However, [terminal-notifier](https://github.com/alloy/terminal-notifier), comes
bundled in the module. So on Mac, not additional installations is necessary.

If using Windows/Growl, `growl` must be installed. For windows see
[Growl for Windows](http://www.growlforwindows.com/gfw/). You can also use
growl on mac, but you need to specify this manually (see API).

By default Notification Center will be used on Mac, notify-send will be used
on Linux, and Growl will be used if neither Mac 10.8 or Linux.

## Install
```
$ npm install node-notifier
```

## Standard Usage
```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
	message: 'Hello World'
});
```

`Notification` also has specifications for all types of notifications, to be used
manually.

Example:
```javascript
var nn = require('node-notifier');

new nn.NotificationCenter().notify();
new nn.NotifySend().notify();
new nn.Growl().notify(options);
```

### Mapping between notifiers
Common options between the modules (i.e. `icon`) is mapped. This means,
if you are using a Mac and someone on your project is using Linux, you
can both see icons.


## Usage NotificationCenter

Same usage and parameter setup as [terminal-notifier](https://github.com/alloy/terminal-notifier).

Native Notification Center requires Mac OS X version 10.8 or higher. If you have
earlier versions, Growl will be the fallback. If Growl isn't installed, an error
will be thrown.

---

### Note: Output parsing from Notification Center is deprecated as of `3.0.0`.

**Parsing of output given by terminal-notifier is removed as of node-notifier `3.0.0`.**
You can still use both `remove` and `list` but the output given will not be parsed into a object.

See removed documentation for pre version `3.0.0` in [Deprecated documentation](DEPRECATED.md)

---


### Example

Where [terminal-notifier](https://github.com/alloy/terminal-notifier) say to use the ```-message``` option, you can do this in node-notifier

```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
	message: 'Hello World'
});
```

You can specify the second argument as a callback for getting ```error``` and ```response```.

```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
	title: 'My application',
	message: 'New notification'
}, function(error, response) {
	console.log(response);
});
```

As of version `3.0.0`, you can also specify image used as icon or content image. **For Mac OS notifications, requires 10.9.**


```javascript

notifier.notify({
  "title": "Phil Coulson",
  "subtitle": "Agent of S.H.I.E.L.D.",
  "message": "If I come out, will you shoot me? 'Cause then I won't come out.",
  "sound": "Funk", // case sensitive
  "contentImage": __dirname + "/coulson.jpg",
  "appIcon": __dirname + "/coulson.jpg",
  "open": "file://" + __dirname + "/coulson.jpg"
});

```

See [terminal-notifier](https://github.com/alloy/terminal-notifier) for more options.

## Usage NotifySend

```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
	title: 'Foo',
	message: 'Hello World',
  icon: __dirname + "/coulson.jpg",
	// .. and other notify-send flags
});
```

See flags and options [on the man pages](http://manpages.ubuntu.com/manpages/gutsy/man1/notify-send.1.html)

## Usage Growl

```javascript
var Notification = require('node-notifier');

var notifier = new Notification({
	// Options as passed to Growler
});
notifier.notify({
	title: 'Foo',
	message: 'Hello World',
  icon: fs.readFileSync(__dirname + "/coulson.jpg")
	// and other growl options like sticky etc.
});
```

See more information for constructor options in
[growler](https://github.com/betamos/Node-Growler/).


## Changelog

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

[![NPM downloads][npm-downloads]][npm-url]


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/node-notifier
[npm-image]: http://img.shields.io/npm/v/node-notifier.svg?style=flat
[npm-downloads]: http://img.shields.io/npm/dm/node-notifier.svg?style=flat

[travis-url]: http://travis-ci.org/mikaelbr/node-notifier
[travis-image]: http://img.shields.io/travis/mikaelbr/node-notifier.svg?style=flat

[depstat-url]: https://gemnasium.com/mikaelbr/node-notifier
[depstat-image]: http://img.shields.io/gemnasium/mikaelbr/node-notifier.svg?style=flat
