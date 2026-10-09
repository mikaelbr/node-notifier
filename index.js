import os from 'node:os';
import utils from './lib/utils.js';
import WindowsBalloon from './notifiers/balloon.js';
import Growl from './notifiers/growl.js';
import NotificationCenter from './notifiers/notificationcenter.js';
import NotifySend from './notifiers/notifysend.js';
import WindowsToaster from './notifiers/toaster.js';

function selectNotifier() {
  const osType = utils.isWSL() ? 'WSL' : os.type();

  switch (osType) {
    case 'Linux':
      return NotifySend;
    case 'Darwin':
      return NotificationCenter;
    case 'Windows_NT':
      return utils.isLessThanWin8() ? WindowsBalloon : WindowsToaster;
    case 'WSL':
      // Opt in to the Linux notifier, e.g. when running an X server
      // with a notification daemon. Read once, when this module loads.
      return process.env.NODE_NOTIFIER_WSL_NOTIFIER === 'linux'
        ? NotifySend
        : WindowsToaster;
    default:
      return /BSD$/.test(os.type()) ? NotifySend : Growl;
  }
}

/** The notifier class picked for the current platform. */
const Notification = selectNotifier();

/** A ready-to-use instance of the notifier for the current platform. */
const notifier = new Notification({ withFallback: true });

// Expose notifiers on the instance to give full control.
Object.assign(notifier, {
  Notification,
  NotifySend,
  NotificationCenter,
  WindowsToaster,
  WindowsBalloon,
  Growl
});

/** `notify` of the default instance, bound so it can be used on its own. */
export const notify = notifier.notify;

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
