import os from 'node:os';
import utils from './lib/utils.ts';
import WindowsBalloon from './notifiers/balloon.ts';
import Growl from './notifiers/growl.ts';
import NotificationCenter from './notifiers/notificationcenter.ts';
import NotifySend from './notifiers/notifysend.ts';
import WindowsToaster from './notifiers/toaster.ts';
import type { AnyNotification, Notifier, NotifierClass } from './types.ts';

export type * from './types.ts';

/** The default notifier, with all notifier classes attached. */
export interface DefaultNotifier extends Notifier<AnyNotification> {
  Notification: NotifierClass;
  NotifySend: typeof NotifySend;
  NotificationCenter: typeof NotificationCenter;
  WindowsToaster: typeof WindowsToaster;
  WindowsBalloon: typeof WindowsBalloon;
  Growl: typeof Growl;
}

// The default notifier takes the options of all notifiers, and each notifier
// ignores the ones it doesn't support.
function selectNotifier(): NotifierClass {
  const osType = utils.isWSL() ? 'WSL' : os.type();

  switch (osType) {
    case 'Linux':
      return NotifySend as NotifierClass;
    case 'Darwin':
      return NotificationCenter as NotifierClass;
    case 'Windows_NT':
      return (
        utils.isLessThanWin8() ? WindowsBalloon : WindowsToaster
      ) as NotifierClass;
    case 'WSL':
      // Opt in to the Linux notifier, e.g. when running an X server
      // with a notification daemon. Read once, when this module loads.
      return (
        process.env.NODE_NOTIFIER_WSL_NOTIFIER === 'linux'
          ? NotifySend
          : WindowsToaster
      ) as NotifierClass;
    default:
      return (/BSD$/.test(os.type()) ? NotifySend : Growl) as NotifierClass;
  }
}

/** The notifier class picked for the current platform. */
const Notification: NotifierClass = selectNotifier();

/** A ready-to-use instance of the notifier for the current platform. */
// Expose notifiers on the instance to give full control.
const notifier: DefaultNotifier = Object.assign(
  new Notification({ withFallback: true }),
  {
    Notification,
    NotifySend,
    NotificationCenter,
    WindowsToaster,
    WindowsBalloon,
    Growl
  }
);

/** `notify` of the default instance, bound so it can be used on its own. */
export const notify: DefaultNotifier['notify'] = notifier.notify;

export default notifier;
export {
  Notification,
  NotifySend,
  NotificationCenter,
  WindowsToaster,
  WindowsBalloon,
  Growl,
  // `require('node-notifier')` keeps returning the instance itself.
  notifier as 'module.exports'
};
