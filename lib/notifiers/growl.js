/**
 * Wrapper for the growly module
 */
var os = require('os'),
    utils = require('../utils'),
    growly = require('growly');

function Growl (options) {
  options = options || {};
  if (!(this instanceof Growl)) {
    return new Growl(options);
  }

  growly.appname = options.name || 'Node';
};

Growl.prototype.notify = function (options, callback) {
  var that = this;
  options = options || {};
  callback = (callback || function () {}).bind(this);

  options = utils.mapToGrowl(options);

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  options.title = options.title || 'Node Notification:';
  growly.notify(options.message, options, callback);
  return this;
};

module.exports = Growl;
