/**
 * Wrapper for the growly module
 */
const checkGrowl = require('../lib/checkGrowl');
const utils = require('../lib/utils');
const growly = require('growly');

const EventEmitter = require('events').EventEmitter;
const util = require('util');

const errorMessageNotFound =
  "Couldn't connect to growl (might be used as a fallback). Make sure it is running";

module.exports = Growl;

let hasGrowl;

function Growl(options) {
  options = utils.clone(options || {});
  if (!(this instanceof Growl)) {
    return new Growl(options);
  }

  growly.appname = stripCarriageReturns(options.name) || 'Node';
  this.options = options;

  EventEmitter.call(this);
}
util.inherits(Growl, EventEmitter);

function notifyRaw(options, callback) {
  growly.setHost(this.options.host, this.options.port);
  options = utils.clone(options || {});

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }

  callback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    function (data) {
      if (data === 'click') {
        return 'click';
      }
      if (data === 'timedout') {
        return 'timeout';
      }
      return false;
    }
  );

  options = utils.mapToGrowl(options);

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  options.title = options.title || 'Node Notification:';

  // GNTP headers are CRLF delimited. Prevent values from injecting extra
  // headers (e.g. a Notification-Callback-Target URL) into the request.
  GNTP_HEADER_OPTIONS.forEach(function (key) {
    options[key] = stripCarriageReturns(options[key]);
  });

  if (hasGrowl || options.wait) {
    const localCallback = options.wait ? callback : noop;
    growly.notify(options.message, options, localCallback);
    if (!options.wait) callback();
    return this;
  }

  checkGrowl(growly, function (_, didHaveGrowl) {
    hasGrowl = didHaveGrowl;
    if (!didHaveGrowl) return callback(new Error(errorMessageNotFound));
    growly.notify(options.message, options);
    callback();
  });
  return this;
}

Object.defineProperty(Growl.prototype, 'notify', {
  get: function () {
    if (!this._notify) this._notify = notifyRaw.bind(this);
    return this._notify;
  }
});

const GNTP_HEADER_OPTIONS = [
  'title',
  'message',
  'label',
  'priority',
  'coalescingId'
];

// Keeps line feeds (multi-line text) but removes the CR needed to end a header.
function stripCarriageReturns(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\r\n?/g, '\n');
}

function noop() {}
