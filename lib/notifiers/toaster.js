/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */

var path = require('path')
  , notifier = path.resolve(__dirname, '../../vendor/toaster/toast.exe')
  , utils = require('../utils')
  , Growl = require('./growl');

var fallbackNotifier = null;

var Notifier = function (options) {
  
  if (!(this instanceof Notifier)) {
    return new Notifier();
  }
  
  this.options = options;

  fallbackNotifier = null;

};

Notifier.prototype.notify = function (options, callback) {

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }
  
  options = utils.mapToWin8(options);

  var argsList = utils.constructArgumentList(options);

  callback = callback || function (err, data) {};

  if(utils.isWin8()) {
    utils.command(notifier, argsList, callback);
    return this;
  } else {
    
    fallbackNotifier = new Growl(self.options);
    return fallbackNotifier.notify(options, callback);
  }
};

module.exports = Notifier;