/**
 * Wrapper for the growly module
 */
var utils = require('../lib/utils'),
    checkGrowl = require('../lib/checkGrowl');
    growly = require('growly');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var errorMessageNotFound = 'Couldn\'t connect to growl (might be used as a fallback). Make sure it is running';

module.exports = Growl;

var hasGrowl = void 0;

function Growl (options) {
  options = options || {};
  if (!(this instanceof Growl)) {
    return new Growl(options);
  }

  growly.appname = options.name || 'Node';

  EventEmitter.call(this);
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

  if (hasGrowl || !!options.wait) {
    var localCallback = !!options.wait ? callback : function () {};
    growly.notify(options.message, options, localCallback);
    if (!options.wait) callback();
    return this;
  }

  checkGrowl(function (didHaveGrowl) {
    hasGrowl = didHaveGrowl;
    if (!didHaveGrowl) return callback(new Error(errorMessageNotFound));
    growly.notify(options.message, options);
    callback();
  });
  return this;
};
