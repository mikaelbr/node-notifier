/**
 * Node.js wrapper for "notify-send".
 */
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import callableClass from '../lib/callableClass.ts';
import utils, { type CommandCallback, type OptionBag } from '../lib/utils.ts';
import type {
  CallableClass,
  NotificationCallback,
  Notifier as NotifierType,
  NotifySendNotification,
  NotifySendOptions
} from '../types.ts';

const notifier = 'notify-send';
let hasNotifier: boolean | undefined;

type Notify = (
  notification?: string | NotifySendNotification,
  callback?: NotificationCallback
) => NotifierType;

class NotifySend
  extends EventEmitter
  implements NotifierType<NotifySendNotification>
{
  options: NotifySendOptions;
  #notify?: Notify;

  constructor(options?: NotifySendOptions) {
    super();
    this.options = utils.clone(options || {});
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify(): Notify {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }
}

const Notifier: CallableClass<typeof NotifySend> = callableClass(NotifySend);
type Notifier = NotifySend;

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function noop() {}
function notifyRaw(
  this: NotifySend,
  notification?: string | NotifySendNotification,
  userCallback?: NotificationCallback
): NotifySend {
  const callback = userCallback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  const options: OptionBag =
    typeof notification === 'string'
      ? { title: 'node-notifier', message: notification }
      : utils.clone(notification || {});

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (os.type() !== 'Linux' && !os.type().match(/BSD$/)) {
    callback(new Error('Only supported on Linux and *BSD systems'));
    return this;
  }

  if (hasNotifier === false) {
    callback(new Error('notify-send must be installed on the system.'));
    return this;
  }

  if (hasNotifier || this.options.suppressOsdCheck) {
    doNotification.call(this, options, callback);
    return this;
  }

  try {
    hasNotifier = !!findOnPath(notifier);
    doNotification.call(this, options, callback);
  } catch (err) {
    hasNotifier = false;
    callback(err as Error);
  }

  return this;
}

function findOnPath(cmd: string): string {
  const dirs = (process.env.PATH || '').split(path.delimiter);
  for (const dir of dirs) {
    const file = path.join(/^".*"$/.test(dir) ? dir.slice(1, -1) : dir, cmd);
    try {
      if (fs.statSync(file).isFile()) {
        fs.accessSync(file, fs.constants.X_OK);
        return file;
      }
    } catch {}
  }
  throw Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' });
}

const allowedArguments = [
  'urgency',
  'expire-time',
  'icon',
  'category',
  'hint',
  'app-name'
];

function doNotification(
  this: NotifySend,
  options: OptionBag,
  callback: NotificationCallback
): void {
  const originalOptions = { ...options };
  const actions = toActionList(options.actions);
  const transient = options.transient === true;
  delete options.actions;
  delete options.transient;

  options = utils.mapToNotifySend(options);
  options.title = options.title || 'Node Notification:';

  const initial = [options.title, options.message];
  delete options.title;
  delete options.message;

  // Executed without a shell, so values are passed verbatim (no quoting or
  // escaping). Title and message go after `--` so values starting with a dash
  // can't be parsed as notify-send options.
  const argsList = [
    ...utils.constructArgumentList(options, {
      keyExtra: '-',
      allowedArguments,
      noEscape: true,
      wrapper: ''
    }),
    // One `--action=NAME=Label` per action, as a single argument so a label
    // can't be read as an option. notify-send splits on the first `=`, so the
    // index as NAME keeps labels containing `=` intact, and is what it prints
    // when the action is chosen.
    ...actions.map((action, i) => `--action=${i}=${action}`),
    // Its own `--hint` argument, so it works alongside a user supplied `hint`.
    // Transient notifications aren't kept in the notification list (GNOME).
    ...(transient ? ['--hint=int:transient:1'] : []),
    '--',
    ...utils.constructArgumentList({}, { initial, noEscape: true, wrapper: '' })
  ];

  if (!actions.length) {
    // Called as-is, with notify-send's stderr as the error.
    utils.commandWithoutShell(
      notifier,
      argsList,
      callback as unknown as CommandCallback
    );
    return;
  }

  // With actions notify-send waits until an action is chosen, the
  // notification is closed or `expire-time` has passed.
  const expireTime = options['expire-time'];
  const start = Date.now();
  const actionJackedCallback = utils.actionJackerDecorator(
    this,
    originalOptions,
    callback,
    (data) => {
      if (data === 'activate') return 'click';
      if (data === 'timeout') return 'timeout';
      return false;
    }
  );

  utils.commandWithoutShell(notifier, argsList, (err, stdout) => {
    if (err instanceof Error) return actionJackedCallback(err, stdout);

    const output = (stdout || '').trim();
    if (/^\d+$/.test(output) && Number(output) < actions.length) {
      return actionJackedCallback(err || null, {
        activationType: 'actionClicked',
        activationValue: actions[Number(output)]
      });
    }

    // notify-send prints "Wait timeout expired" when its own timer runs out,
    // but the notification daemon may close it at the same moment instead.
    const timedOut =
      String(err || '').includes('Wait timeout expired') ||
      (expireTime > 0 && Date.now() - start >= expireTime);
    if (timedOut)
      return actionJackedCallback(null, { activationType: 'timeout' });
    actionJackedCallback(err || null, { activationType: 'closed' });
  });
}

function toActionList(actions: unknown): string[] {
  if (actions === undefined || actions === null) return [];
  return (Array.isArray(actions) ? actions : [actions]).map(String);
}
