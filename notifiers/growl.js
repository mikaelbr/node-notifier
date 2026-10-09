/**
 * Wrapper for the growly module
 */
import { EventEmitter } from 'node:events';
import growly from 'growly';
import callableClass from '../lib/callableClass.js';
import checkGrowl from '../lib/checkGrowl.js';
import utils from '../lib/utils.js';

const errorMessageNotFound =
  "Couldn't connect to growl (might be used as a fallback). Make sure it is running";

let hasGrowl;

class Growl extends EventEmitter {
  #notify;

  constructor(options) {
    super();
    options = utils.clone(options || {});
    growly.appname = stripCarriageReturns(options.name) || 'Node';
    this.options = options;
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify() {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }
}

const Notifier = callableClass(Growl);

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function notifyRaw(options, callback) {
  growly.setHost(this.options.host, this.options.port);
  options = utils.clone(options || {});

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }

  callback = utils.actionJackerDecorator(this, options, callback, (data) => {
    if (data === 'click') {
      return 'click';
    }
    if (data === 'timedout') {
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

  // GNTP headers are CRLF delimited. Prevent values from injecting extra
  // headers (e.g. a Notification-Callback-Target URL) into the request.
  for (const key of GNTP_HEADER_OPTIONS) {
    options[key] = stripCarriageReturns(options[key]);
  }

  if (hasGrowl || options.wait) {
    const localCallback = options.wait ? callback : noop;
    growly.notify(options.message, options, localCallback);
    if (!options.wait) callback();
    return this;
  }

  checkGrowl(growly, (_, didHaveGrowl) => {
    hasGrowl = didHaveGrowl;
    if (!didHaveGrowl) return callback(new Error(errorMessageNotFound));
    growly.notify(options.message, options);
    callback();
  });
  return this;
}

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
