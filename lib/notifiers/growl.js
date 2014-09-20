/**
 * Wrapper for the growly module
 */
var os = require('os'),
    utils = require('../utils'),
    growly = require('growly');

var Notifier = function (options) {
  options = options || {};
  if (!(this instanceof Notifier)) {
    return new Notifier(options);
  }
  this.name = options.name || 'Node';
  this.isRegistered = false;
};

var doNotification = function (options, callback) {
  options.title = options.title || 'Node Notification:';
  growly.notify(options.message, options, callback);
};

Notifier.prototype.notify = function (options, callback) {
  var that = this;
  options = options || {};
  callback = (callback || function () {}).bind(this);

  options = utils.mapToGrowl(options);

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (this.isRegistered) {
    return doNotification(options, callback);
    return this;
  }

  growly.register(this.name, function(err) {
    if (err) {
      if (!that.hasError) {
        that.hasError = true;
        callback(err);
      }
      return false;
    }

    that.isRegistered = true;
    that.hasError = false;
    doNotification(options, callback);
  });
  return this;
};

module.exports = Notifier;