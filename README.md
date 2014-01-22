# node-notifier

A Node.js wrapper for the [terminal-notifier](https://github.com/alloy/terminal-notifier) application by [Eloy Durán](https://github.com/alloy).

## Requirements
- Mac OS X (>= 10.8) or Linux with the notify-send module.

If using Linux, `notify-send` must be installed on your system.
However, [terminal-notifier](https://github.com/alloy/terminal-notifier), comes
bundled in the module. So on Mac, not additional installations is necessary.

## Install
```
$ npm install node-notifier
```


## Usage
Same usage and parameter setup as [terminal-notifier](https://github.com/alloy/terminal-notifier).

### Example

Where [terminal-notifier](https://github.com/alloy/terminal-notifier) say to use the ```-message``` option, you can do this in node-notifier

```javascript
var notifier = require('node-notifier');

notifier.notify({
	message: 'Hello World'
});
```


You can specify the second argument as a callback for getting ```error``` and ```response```.

```javascript
var notifier = require('node-notifier');

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


## Module TODO

1. Be robust and have unit tests.

When these criterias are met, the module will be versioned 1.0.

_NB:_ Previous plans of supporting both growlnotify and terminal-notifier, are abandoned. This module will only do terminal-notifier.