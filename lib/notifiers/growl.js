/**
 * Wrapper for the growler module
 */
var os = require('os')
  , growler = require('growler');

var Notifier = function (options) {
  if (!(this instanceof Notifier)) {
    return new Notifier(options);
  }
  this.app = new growler.GrowlApplication('Gulp', options);

  this.app.setNotifications({
    Gulp: {}
  });

  this.isRegistered = false;
};

var doNotification = function (app, options, callback) {
  options.title = options.title || 'Node Notification:';
  options.text = options.message;
  delete options.message;

  app.sendNotification('Gulp', options, function (success, err) {
    return callback(err);
  });
  return this;
};

Notifier.prototype.notify = function (options, callback) {
  var app = this.app;
  var that = this;
  options = options || {};
  callback = callback || function () {};
  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (this.isRegistered) {
    doNotification(app, options, callback);
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
