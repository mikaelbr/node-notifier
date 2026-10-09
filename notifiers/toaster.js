/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import callableClass from '../lib/callableClass.js';
import utils from '../lib/utils.js';
import Balloon from './balloon.js';

const notifier = path.resolve(
  import.meta.dirname,
  '../vendor/snoreToast/snoretoast'
);

let fallback;

const PIPE_NAME = 'notifierPipe';
const PIPE_PATH_PREFIX = '\\\\.\\pipe\\';
const PIPE_PATH_PREFIX_WSL = '/tmp/';

class WindowsToaster extends EventEmitter {
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

const Notifier = callableClass(WindowsToaster);

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function noop() {}

function parseResult(data) {
  if (!data) {
    return {};
  }
  return data.split(';').reduce((acc, cur) => {
    const split = cur.split('=');
    if (split && split.length === 2) {
      acc[split[0]] = split[1];
    }
    return acc;
  }, {});
}

function getPipeName() {
  const pathPrefix = utils.isWSL() ? PIPE_PATH_PREFIX_WSL : PIPE_PATH_PREFIX;
  return `${pathPrefix}${PIPE_NAME}-${crypto.randomUUID()}`;
}

function notifyRaw(options, callback) {
  options = utils.clone(options || {});
  callback = callback || noop;
  const is64Bit = os.arch() === 'x64';
  let resultBuffer;
  const server = {
    namedPipe: getPipeName()
  };

  if (typeof options === 'string') {
    options = { title: 'node-notifier', message: options };
  }

  if (typeof callback !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof callback}`
    );
  }

  const snoreToastResultParser = (err, callback) => {
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
    const result = parseResult(resultBuffer?.toString('utf16le'));

    // parse action
    if (result.action === 'buttonClicked' && result.button) {
      result.activationType = result.button;
    } else if (result.action) {
      result.activationType = result.action;
    }

    if (err && err.code === -1) {
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

  const actionJackedCallback = (err) =>
    snoreToastResultParser(
      err,
      utils.actionJackerDecorator(this, options, callback, (data) =>
        data === 'activate' ? 'click' : data || false
      )
    );

  options.title = options.title || 'Node Notification:';
  if (options.message === undefined && options.close === undefined) {
    callback(new Error('Message or ID to close is required.'));
    return this;
  }

  if (!utils.isWin8() && !utils.isWSL() && this.options.withFallback) {
    fallback = fallback || new Balloon(this.options);
    return fallback.notify(options, callback);
  }

  // Add pipeName option, to get the output
  utils.createNamedPipe(server).then((out) => {
    resultBuffer = out;
    options.pipeName = server.namedPipe;

    const localNotifier =
      options.customPath ||
      this.options.customPath ||
      `${notifier}-x${is64Bit ? '64' : '86'}.exe`;

    options = utils.mapToWin8(options);
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
