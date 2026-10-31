/**
 * A Node.js wrapper for terminal-notify (with fallback).
 */
import type { ExecFileException } from 'node:child_process';
import { EventEmitter } from 'node:events';
import callableClass from '../lib/callableClass.ts';
import utils, { type OptionBag } from '../lib/utils.ts';
import { vendorPath } from '../lib/vendor.ts';
import type {
  CallableClass,
  NotificationCallback,
  NotificationMetadata,
  Notifier as NotifierType,
  NotifierOptions,
  NotificationCenterNotification
} from '../types.ts';
import Growl from './growl.ts';

const notifier = vendorPath(
  'mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier'
);

const errorMessageOsX =
  'You need macOS 10.14 or above to use NotificationCenter,' +
  ' or use Growl fallback with constructor option {withFallback: true}.';

type Notify = (
  notification?: string | NotificationCenterNotification,
  callback?: NotificationCallback
) => NotifierType;

class NotificationCenter
  extends EventEmitter
  implements NotifierType<NotificationCenterNotification>
{
  options: NotifierOptions;
  /** Clears each waiting notification. Used by `clearAll`. */
  _activeNotifications: Set<() => void>;
  #notify?: Notify;

  constructor(options?: NotifierOptions) {
    super();
    this.options = utils.clone(options || {});
    this._activeNotifications = new Set();
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify(): Notify {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }

  /**
   * Kill all running terminal-notifier processes started by this instance, so
   * the application can exit without waiting for their timeouts. Callbacks of
   * cleared notifications are called without an error or response.
   */
  clearAll(): void {
    for (const clear of this._activeNotifications) clear();
    this._activeNotifications.clear();
  }
}

const Notifier: CallableClass<typeof NotificationCenter> =
  callableClass(NotificationCenter);
type Notifier = NotificationCenter;

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

let activeId: object | null = null;

function noop() {}
function notifyRaw(
  this: NotificationCenter,
  notification?: string | NotificationCenterNotification,
  userCallback?: NotificationCallback
): NotifierType {
  const id = {};
  let options: OptionBag =
    typeof notification === 'string'
      ? { title: 'node-notifier', message: notification }
      : utils.clone(notification || {});
  activeId = id;
  const callback = userCallback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  const actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    (data) => {
      if (activeId !== id) return false;

      if (data === 'activate') {
        return 'click';
      }
      if (data === 'timeout') {
        return 'timeout';
      }
      if (data === 'replied') {
        return 'replied';
      }
      return false;
    }
  );

  options = utils.mapToMac(options);

  if (!options.message && !options.group && !options.list && !options.remove) {
    callback(new Error('Message, group, remove or list property is required.'));
    return this;
  }

  // Action titles are passed unquoted (see constructArgumentList), and
  // terminal-notifier matches flags like -help or -reply anywhere in argv, so a
  // title starting with "-" could change what it does.
  if (
    options.actions?.some((action: unknown) => String(action).startsWith('-'))
  ) {
    callback(new Error('Action titles can not start with "-".'));
    return this;
  }

  const argsList = constructArgumentList(options);
  if (utils.isMojaveOrLater()) {
    let finished = false;
    let cleared = false;
    const clear = () => {
      cleared = true;
      child.kill();
    };
    const child = utils.fileCommand(
      this.options.customPath || notifier,
      argsList,
      (err, stdout) => {
        finished = true;
        this._activeNotifications.delete(clear);
        // Being killed by clearAll is expected, not an error.
        if (cleared) return actionJackedCallback(null);

        const output = (stdout || '').trim();
        // terminal-notifier exits with 6 when nobody responded in time.
        if ((err as ExecFileException)?.code === 6 && output === '@TIMEOUT') {
          err = null;
        }
        if (err instanceof Error) return actionJackedCallback(err, stdout);

        // Otherwise `err` holds any warnings terminal-notifier wrote to stderr.
        const response =
          options.list || options.remove
            ? stdout
            : parseResponse(output, options);
        actionJackedCallback(err || null, response);
      }
    );
    if (child && !finished) this._activeNotifications.add(clear);
    return this;
  }

  if (this.options.withFallback) {
    return new Growl(this.options).notify(options, callback);
  }

  callback(new Error(errorMessageOsX));
  return this;
}

// Action titles are read by terminal-notifier straight from argv, so unlike the
// other values they can't be quoted. One `-action` per title, since it splits
// each value on commas.
function constructArgumentList(options: OptionBag): string[] {
  const { actions, ...rest } = options;
  const args = utils.constructArgumentList(rest);
  for (const action of actions || []) args.push('-action', String(action));
  return args;
}

// terminal-notifier prints a single line for actions and reply: the chosen
// action title, the reply text, or one of the @-markers below. Map it to the
// metadata shape earlier versions emitted as JSON.
function parseResponse(
  output: string,
  options: OptionBag
): NotificationMetadata {
  if (!output) return {};
  if (output === '@TIMEOUT') return { activationType: 'timeout' };
  if (output === '@CLOSED') return { activationType: 'closed' };
  if (output === '@ACTIONCLICKED') return { activationType: 'contentsClicked' };
  if (options.actions?.includes(output)) {
    return { activationType: 'actionClicked', activationValue: output };
  }
  if (options.reply !== undefined) {
    return { activationType: 'replied', activationValue: output };
  }
  return {};
}
