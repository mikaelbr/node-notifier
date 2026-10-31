/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
import type { ExecFileException } from 'node:child_process';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import callableClass from '../lib/callableClass.ts';
import utils, {
  type CommandCallback,
  type OptionBag,
  type PipeServer
} from '../lib/utils.ts';
import { vendorPath } from '../lib/vendor.ts';
import type {
  CallableClass,
  NotificationCallback,
  Notifier as NotifierType,
  NotifierOptions,
  WindowsToasterNotification
} from '../types.ts';
import Balloon from './balloon.ts';

const notifier = vendorPath('snoreToast', 'snoretoast');

let fallback: Balloon | undefined;

const PIPE_NAME = 'notifierPipe';
const PIPE_PATH_PREFIX = '\\\\.\\pipe\\';
const PIPE_PATH_PREFIX_WSL = '/tmp/';

type Notify = (
  notification?: string | WindowsToasterNotification,
  callback?: NotificationCallback
) => NotifierType;

class WindowsToaster
  extends EventEmitter
  implements NotifierType<WindowsToasterNotification>
{
  options: NotifierOptions;
  #notify?: Notify;

  constructor(options?: NotifierOptions) {
    super();
    this.options = utils.clone(options || {});
  }

  // A getter returning a bound function, so `notify` can be detached.
  get notify(): Notify {
    this.#notify ??= notifyRaw.bind(this);
    return this.#notify;
  }
}

const Notifier: CallableClass<typeof WindowsToaster> =
  callableClass(WindowsToaster);
type Notifier = WindowsToaster;

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function noop() {}

function parseResult(data: string): Record<string, string> {
  if (!data) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const cur of data.split(';')) {
    const [key, value, ...rest] = cur.split('=');
    if (key !== undefined && value !== undefined && !rest.length) {
      result[key] = value;
    }
  }
  return result;
}

function getPipeName(): string {
  const pathPrefix = utils.isWSL() ? PIPE_PATH_PREFIX_WSL : PIPE_PATH_PREFIX;
  return `${pathPrefix}${PIPE_NAME}-${crypto.randomUUID()}`;
}

function notifyRaw(
  this: WindowsToaster,
  notification?: string | WindowsToasterNotification,
  userCallback?: NotificationCallback
): NotifierType {
  let options: OptionBag =
    typeof notification === 'string'
      ? { title: 'node-notifier', message: notification }
      : utils.clone(notification || {});
  const callback = userCallback || noop;
  const is64Bit = os.arch() === 'x64';
  let resultChunks: Buffer[] = [];
  const server: PipeServer = {
    namedPipe: getPipeName()
  };

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  const snoreToastResultParser = (
    err: Error | string | null | undefined,
    callback: (err?: Error | string | null, data?: unknown) => void
  ) => {
    /* Possible exit statuses from SnoreToast, we only want to include err if it's -1 code
    Exit Status     :  Exit Code
    Failed          : -1

    Success         :  0
    Hidden          :  1
    Dismissed       :  2
    TimedOut        :  3
    ButtonPressed   :  4
    TextEntered     :  5
    */
    const result = parseResult(Buffer.concat(resultChunks).toString('utf16le'));

    // parse action
    if (result.action === 'buttonClicked' && result.button) {
      result.activationType = result.button;
    } else if (result.action) {
      result.activationType = result.action;
    }

    if ((err as ExecFileException | null | undefined)?.code === -1) {
      callback(err, result);
    } else {
      callback(null, result);
    }

    // https://github.com/mikaelbr/node-notifier/issues/334
    // Due to an issue with snoretoast not using stdio and pipe
    // when notifications are disabled, make sure named pipe server
    // is closed before exiting.
    server.instance?.close();
  };

  const actionJackedCallback: CommandCallback = (err) =>
    snoreToastResultParser(
      err,
      utils.actionJackerDecorator(this, options, callback, (data) =>
        data === 'activate' ? 'click' : data || false
      )
    );

  options.title = options.title || 'Node Notification:';
  if (
    options.message === undefined &&
    options.close === undefined &&
    options.remove === undefined
  ) {
    callback(new Error('Message or ID to close is required.'));
    return this;
  }

  // Arguments are passed as-is, so an application starting with "-" could be
  // read by SnoreToast as a flag.
  if (String(options.application ?? '').startsWith('-')) {
    callback(new Error('Application can not start with "-".'));
    return this;
  }

  if (!utils.isWin8() && !utils.isWSL() && this.options.withFallback) {
    fallback = fallback || new Balloon(this.options);
    return fallback.notify(options, callback);
  }

  // Add pipeName option, to get the output
  utils.createNamedPipe(server).then((out) => {
    resultChunks = out;
    options.pipeName = server.namedPipe;

    const customPath = options.customPath || this.options.customPath;
    const localNotifier =
      customPath || `${notifier}-x${is64Bit ? '64' : '86'}.exe`;

    options = utils.mapToWin8(options);

    // The bundled x86 SnoreToast (0.7.0) lacks `-d` and errors on unknown args.
    if (!customPath && !is64Bit) {
      delete options.d;
    }
    const argsList = utils.constructArgumentList(options, {
      explicitTrue: true,
      wrapper: '',
      keepNewlines: true,
      noEscape: true
    });

    utils.fileCommand(localNotifier, argsList, actionJackedCallback);
  });
  return this;
}
