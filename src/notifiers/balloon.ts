/**
 * Wrapper for the notifu 1.6 (http://www.paralint.com/projects/notifu/)

Usage
/t <value>      The type of message to display values are:
                    info      The message is an informational message
                    warn      The message is an warning message
                    error     The message is an error message
/d <value>      The number of milliseconds to display (omit or 0 for infinit)
/p <value>      The title (or prompt) of the ballon
/m <value>      The message text
/i <value>      Specify an icon to use ("parent" uses the icon of the parent process)
/e              Enable ballon tips in the registry (for this user only)
/q              Do not play a sound when the tooltip is displayed
/w              Show the tooltip even if the user is in the quiet period that follows his very first login (Windows 7 and up)
/xp             Use IUserNotification interface event when IUserNotification2 is available
/l              Display license for notifu

// Kill codes:
  2 = Timeout
  3 = Clicked
  4 = Closed or faded out

 */
import type { ExecFileException } from 'node:child_process';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import callableClass from '../lib/callableClass.ts';
import checkGrowl from '../lib/checkGrowl.ts';
import utils, { type CommandCallback, type OptionBag } from '../lib/utils.ts';
import { vendorPath } from '../lib/vendor.ts';
import type {
  CallableClass,
  GrowlOptions,
  NotificationCallback,
  Notifier as NotifierType,
  NotifierOptions,
  WindowsBalloonNotification
} from '../types.ts';
import Growl from './growl.ts';
import Toaster from './toaster.ts';

const notifier = vendorPath('notifu', 'notifu');

let hasGrowl: boolean | undefined;

type Notify = (
  notification?: string | WindowsBalloonNotification,
  callback?: NotificationCallback
) => NotifierType;

class WindowsBalloon
  extends EventEmitter
  implements NotifierType<WindowsBalloonNotification>
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

const Notifier: CallableClass<typeof WindowsBalloon> =
  callableClass(WindowsBalloon);
type Notifier = WindowsBalloon;

export default Notifier;
// `require()` of this file keeps returning the class itself.
export { Notifier as 'module.exports' };

function noop() {}
function notifyRaw(
  this: WindowsBalloon,
  notification?: string | WindowsBalloonNotification,
  userCallback?: NotificationCallback
): NotifierType {
  const notifierOptions = this.options;
  const options: OptionBag =
    typeof notification === 'string'
      ? { title: 'node-notifier', message: notification }
      : utils.clone(notification || {});
  const callback = userCallback || noop;

  const actionJackedCallback = utils.actionJackerDecorator(
    this,
    options,
    callback,
    (data) => {
      if (data === 'activate') {
        return 'click';
      }
      if (data === 'timeout') {
        return 'timeout';
      }
      return false;
    }
  );

  if (this.options.withFallback && utils.isWin8()) {
    return new Toaster(notifierOptions).notify(options, callback);
  }

  if (
    this.options.withFallback &&
    (!utils.isLessThanWin8() || hasGrowl === true)
  ) {
    return new Growl(notifierOptions).notify(options, callback);
  }

  if (!this.options.withFallback || hasGrowl === false) {
    doNotification(options, notifierOptions, actionJackedCallback);
    return this;
  }

  // Options are passed on to Growl as-is, so may hold its host and port.
  checkGrowl(notifierOptions as GrowlOptions, (_, hasGrowlResult) => {
    hasGrowl = hasGrowlResult;

    if (hasGrowl) {
      return new Growl(notifierOptions).notify(options, callback);
    }

    doNotification(options, notifierOptions, actionJackedCallback);
  });

  return this;
}

const allowedArguments = ['t', 'd', 'p', 'm', 'i', 'e', 'q', 'w', 'xp'];

function doNotification(
  options: OptionBag,
  notifierOptions: NotifierOptions,
  callback: CommandCallback
): void {
  const is64Bit = os.arch() === 'x64';
  options = utils.mapToNotifu(options);
  options.p = options.p || 'Node Notification:';

  const fullNotifierPath = `${notifier + (is64Bit ? '64' : '')}.exe`;
  const localNotifier = notifierOptions.customPath || fullNotifierPath;

  if (!options.m) {
    callback(new Error('Message is required.'));
    return;
  }

  const argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true,
    explicitTrue: true,
    allowedArguments
  });

  if (options.wait) {
    utils.fileCommand(localNotifier, argsList, (error, data) => {
      // notifu reports how the balloon was closed in its exit code.
      const code = (error as ExecFileException | null | undefined)?.code;
      const action = fromErrorCodeToAction(code);
      if (action === 'error') return callback(error, data);

      return callback(null, action);
    });
    return;
  }
  utils.immediateFileCommand(localNotifier, argsList, callback);
}

function fromErrorCodeToAction(errorCode: unknown): string {
  switch (errorCode) {
    case 2:
      return 'timeout';
    case 3:
    case 6:
    case 7:
      return 'activate';
    case 4:
      return 'close';
    default:
      return 'error';
  }
}
