/**
 * Node.js wrapper for "notify-send".
 */
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import callableClass from '../lib/callableClass.js';
import utils from '../lib/utils.js';

const notifier = 'notify-send';
let hasNotifier;

class NotifySend extends EventEmitter {
  #notify;

  constructor(options) {
    super();
    this.options = utils.clone(options || {});
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify() {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }
}

const Notifier = callableClass(NotifySend);

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function noop() {}
function notifyRaw(options, callback) {
  options = utils.clone(options || {});
  callback = callback || noop;

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }

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
    doNotification(options, callback);
    return this;
  }

  try {
    hasNotifier = !!findOnPath(notifier);
    doNotification(options, callback);
  } catch (err) {
    hasNotifier = false;
    return callback(err);
  }

  return this;
}

function findOnPath(cmd) {
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

function doNotification(options, callback) {
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
    '--',
    ...utils.constructArgumentList({}, { initial, noEscape: true, wrapper: '' })
  ];

  utils.commandWithoutShell(notifier, argsList, callback);
}
