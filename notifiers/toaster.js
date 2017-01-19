/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
var path = require('path');
var notifier = path.resolve(__dirname, '../vendor/snoreToast/SnoreToast.exe');
var utils = require('../lib/utils');
var Balloon = require('./balloon');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var fallback = void 0;

module.exports = WindowsToaster;

function WindowsToaster(options) {
  options = utils.clone(options || {});
  if (!(this instanceof WindowsToaster)) {
    return new WindowsToaster(options);
  }

  this.options = options;

  EventEmitter.call(this);
}
util.inherits(WindowsToaster, EventEmitter);

function noop() {
}
WindowsToaster.prototype.notify = function(options, callback) {
  options = utils.clone(options || {});
  callback = callback || noop;

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }

  var actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    function(data) {
      if (data === 'activate') {
        return 'click';
      }
      if (data === 'timeout') {
        return 'timeout';
      }
      return false;
    }
  );

  options.title = options.title || 'Node Notification:';

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (!utils.isWin8() && !!this.options.withFallback) {
    fallback = fallback || new Balloon(this.options);
    return fallback.notify(options, callback);
  }

  options = utils.mapToWin8(options);
  var argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true
  });
  utils.fileCommand(
    this.options.customPath || notifier,
    argsList,
    actionJackedCallback
  );
  return this;
};
