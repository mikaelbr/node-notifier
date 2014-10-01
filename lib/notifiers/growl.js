/**
 * Wrapper for the growly module
 */
var utils = require('../utils'),
    growly = require('growly');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

module.exports = Growl;

function Growl (options) {
  options = options || {};
  if (!(this instanceof Growl)) {
    return new Growl(options);
  }

  growly.appname = options.name || 'Node';
}
util.inherits(Growl, EventEmitter);


Growl.prototype.notify = function (options, callback) {
  options = options || {};
  callback = utils.actionJackerDecorator(this, options, callback, function (data) {
    var cleaned = data.toLowerCase().trim();
    if (cleaned === 'click') {
      return 'click';
    }
    if (cleaned === 'timedout') {
      return 'timeout';
    }
    return false;
  });

  options = utils.mapToGrowl(options);

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  options.title = options.title || 'Node Notification:';

  var localCallback = options.wait ? callback : function () {};
  growly.notify(options.message, options, localCallback);
  if (!options.wait) callback();
  return this;
};
