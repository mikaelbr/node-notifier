/**
 * Wrapper for the growly module
 */
import { EventEmitter } from 'node:events';
import growly from 'growly';
import callableClass from '../lib/callableClass.ts';
import checkGrowl from '../lib/checkGrowl.ts';
import utils, { type OptionBag } from '../lib/utils.ts';
import type {
  CallableClass,
  GrowlNotification,
  GrowlOptions,
  NotificationCallback,
  Notifier as NotifierType
} from '../types.ts';

const errorMessageNotFound =
  "Couldn't connect to growl (might be used as a fallback). Make sure it is running";

let hasGrowl: boolean | undefined;

type Notify = (
  notification?: string | GrowlNotification,
  callback?: NotificationCallback
) => NotifierType;

class Growl extends EventEmitter implements NotifierType<GrowlNotification> {
  options: GrowlOptions;
  #notify?: Notify;

  constructor(options?: GrowlOptions) {
    super();
    options = utils.clone(options || {});
    growly.appname = stripCarriageReturns(options.name) || 'Node';
    this.options = options;
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify(): Notify {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }
}

const Notifier: CallableClass<typeof Growl> = callableClass(Growl);
type Notifier = Growl;

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function notifyRaw(
  this: Growl,
  notification?: string | GrowlNotification,
  userCallback?: NotificationCallback
): Growl {
  growly.setHost(this.options.host, this.options.port);
  let options: OptionBag =
    typeof notification === 'string'
      ? { title: 'node-notifier', message: notification }
      : utils.clone(notification || {});

  const callback = utils.actionJackerDecorator(
    this,
    options,
    userCallback,
    (data) => {
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
function stripCarriageReturns<T>(value: T): T {
  if (typeof value !== 'string') return value;
  return value.replace(/\r\n?/g, '\n') as T;
}

function noop() {}
