# node-notifier

A Node.js wrapper for the [terminal-notifier](https://github.com/alloy/terminal-notifier) application by [Eloy Durán](https://github.com/alloy). 

_This module is experimental/in early stage (v0.0.2)._

## Requirements
- Mac OS X (>= 10.8

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


## Plans for this module

This module should eventually be a wrapper for both growlnotify and terminal-notifier and thus be able to

1. Work on platforms where Growl is supported
2. Use Notification Center if Mac OS >= 10.8, unless other is specified. 
3. Work with both growlnotify options and terminal-notifier, in addition to have an interpolation between their options.
4. Be robust and have tests.

When these criterias are met, the module will be versioned 1.0. 