/**
 * Wrapper for the growler module
 */
var os = require('os'),
    utils = require('../utils'),
    growler = require('growler');

var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier(options);
  }
  this.app = new growler.GrowlApplication('Node', options);

  this.app.setNotifications({
    Node: {}
  });

  this.isRegistered = false;
};

var doNotification = function (app, options, callback) {
  options.title = options.title || 'Node Notification:';

  app.sendNotification('Node', options, function (success, err) {
    return callback(err);
  });
};

Notifier.prototype.notify = function (options, callback) {
  var app = this.app;
  var that = this;
  options = options || {};
  callback = callback || function () {};

  options = utils.mapToGrowl(options);

  if (!options.text) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (this.isRegistered) {
    return doNotification(app, options, callback);
    return this;
  }

  app.register(function(success, err) {
    if (!success) {
      if (!that.hasError) {
        that.hasError = true;
        callback(err);
      }
      return false;
    }

    that.isRegistered = true;
    that.hasError = false;
    doNotification(app, options, callback);
  });
  return this;
};

module.exports = Notifier;
