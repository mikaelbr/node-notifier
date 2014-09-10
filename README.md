# node-notifier [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

A node module for sending notification using node. Uses terminal-notifier on mac,
notify-send for Linux, toaster for Windows 8 and Growl for others.

![Mac Screenshot](https://github.com/mikaelbr/node-notifier/blob/master/example/mac.png)
![Native Windows Screenshot](https://github.com/mikaelbr/node-notifier/blob/master/example/windows.png)
![Growl Screenshot](https://github.com/mikaelbr/node-notifier/blob/master/example/growl.png)

## Requirements
- Mac OS X >= 10.8.
- Linux with the notify-osd/notify-send module
- Windows >= 8.
- Or if no of the above requirements are met, Growl is used.

If using Linux, `notify-osd` must be installed on your system.
For Mac, [terminal-notifier](https://github.com/alloy/terminal-notifier), comes
bundled in the module. So on Mac, not additional installations is necessary.

This also goes for native Windows (version >=8) as well, where
[toaster.exe](https://github.com/nels-o/toaster) is bundled. Note, for native
Windows notifications [a toast must have a shortcut installed (though not
necessarily pinned) to the Start screen or in the Apps
view](http://msdn.microsoft.com/en-in/library/windows/apps/hh779727.aspx)

If no of the other requirements are met, node-notifier will use Growl.
You have to have Growl installed on your system. See
[Growl for Windows](http://www.growlforwindows.com/gfw/) or
[Growl for Mac](http://growl.info/).

## Install
```
$ npm install node-notifier
```

## Standard Usage
```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
  title: 'My awesome title',
  message: 'Hello from node, Mr. User!'
});
```

`Notification` also has specifications for all types of notifications, to be used
manually.

Example:
```javascript
var nn = require('node-notifier');

new nn.NotificationCenter().notify();
new nn.NotifySend().notify();
new nn.WindowsToaster().notify(options);
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

var notifier = new Notification({
  // Options passed to Growl if fallback
});

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

var notifier = new Notification({
  // Options passed to Growl if fallback
});
notifier.notify({
  title: 'Foo',
  message: 'Hello World',
  icon: __dirname + "/coulson.jpg",
  // .. and other notify-send flags
});
```

See flags and options [on the man pages](http://manpages.ubuntu.com/manpages/gutsy/man1/notify-send.1.html)

## Usage Native Windows

```javascript
var Notification = require('node-notifier');

var notifier = new Notification({
  // Options passed to Growl if fallback
});
notifier.notify({
  title: 'Foo',
  message: 'Hello World',
  icon: __dirname + "/coulson.jpg"
});
```


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
