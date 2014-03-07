# node-notifier

A node module for sending notification using node. Uses terminal-notifier on mac,
notify-send for Linux and growl for others.

For mac this is a wrapper for the
[terminal-notifier](https://github.com/alloy/terminal-notifier) application by
[Eloy Durán](https://github.com/alloy).

## Requirements
- Mac OS X (>= 10.8)
- Linux with the notify-send module
- Or Growl on Windows

If using Linux, `notify-send` must be installed on your system.
However, [terminal-notifier](https://github.com/alloy/terminal-notifier), comes
bundled in the module. So on Mac, not additional installations is necessary.

If using Windows/Growl, `growl` must be installed. For windows see
[Growl for Windows](http://www.growlforwindows.com/gfw/). You can also use
growl on mac, but you need to specify this manually (see API).

By default Notification Center will be used on Mac, notify-send will be used
on Linux, and Growl will be used if neither mac or linux.

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


## Usage NotificationCenter

Same usage and parameter setup as [terminal-notifier](https://github.com/alloy/terminal-notifier).

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

The response will be given as an object. E.g., when running ```notifier.notify({list: "ALL"})```, this could be the response:

```
{ response:
   [ { GroupID: null,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Another message',
       'Delivered At': Wed Dec 12 2012 15:23:38 GMT+0100 (CET) },
     { GroupID: null,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Another message',
       'Delivered At': Wed Dec 12 2012 15:23:31 GMT+0100 (CET) },
     { GroupID: 2,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Testing',
       'Delivered At': Wed Dec 12 2012 15:22:41 GMT+0100 (CET) },
     { GroupID: 1,
       Title: 'Terminal',
       Subtitle: null,
       Message: 'Testing',
       'Delivered At': Wed Dec 12 2012 15:22:29 GMT+0100 (CET) } ],
  type: 'list' }

```

There are three different types:

- ```deliviered``` when a message is delivered.
- ```removed``` when all or one message is removed. If all messages are removed, the response property will have several elements.
- ```list``` when a list is presented. Even when doing ```list: 1```.

## Usage NotifySend

```javascript
var Notification = require('node-notifier');

var notifier = new Notification();
notifier.notify({
	title: 'Foo',
	message: 'Hello World'
	// .. and other notify-send flags
});
```

## Usage NotifySend

```javascript
var Notification = require('node-notifier');

var notifier = new Notification({
	// Options as passed to Growler
});
notifier.notify({
	title: 'Foo',
	message: 'Hello World'
	// and other growl options like sticky etc.
});
```

See more information for constructor options in
[growler](https://github.com/betamos/Node-Growler/).

## Module TODO

1. Add tests for notify-send and growl
