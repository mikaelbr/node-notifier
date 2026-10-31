import type { EventEmitter } from 'node:events';

/** Options passed to a notifier's constructor. */
export interface NotifierOptions {
  /** Use the fallback notifier when the platform's one isn't available. */
  withFallback?: boolean;
  /** Path to your own notifier binary instead of the bundled one. */
  customPath?: string;
}

/** Options shared by all notifiers. */
export interface Notification {
  title?: string;
  message?: string;
  /** Absolute path to an icon. Not supported on macOS. */
  icon?: string;
  sound?: boolean | string;
  /** Wait for the user to respond. */
  wait?: boolean;
}

/** Extra data about how the user responded to a notification. */
export interface NotificationMetadata {
  activationType?: string;
  activationValue?: string;
  [key: string]: unknown;
}

/**
 * Called once the notification is sent, or when the user responded to it.
 * `response` is the lower-cased activation type, e.g. `activate` or `timeout`.
 */
export type NotificationCallback = (
  err: Error | null,
  response?: string,
  metadata?: NotificationMetadata
) => void;

/** What all notifiers have in common. */
export interface Notifier<N extends object = Notification>
  extends EventEmitter {
  options: NotifierOptions;
  /** Sends a notification. Bound, so it can be detached from the notifier. */
  readonly notify: (
    notification?: string | N,
    callback?: NotificationCallback
  ) => Notifier;
}

/**
 * A notifier class. Classes can also be called without `new`, which is kept
 * for backwards compatibility.
 */
export type CallableClass<C extends abstract new (...args: never) => unknown> =
  C & ((...args: ConstructorParameters<C>) => InstanceType<C>);

/** `NotificationCenter` (macOS), wrapping terminal-notifier. */
export interface NotificationCenterNotification extends Notification {
  subtitle?: string;
  /** `true` for 'Bottle', or the name of a system sound. */
  sound?: boolean | string;
  /** Absolute path to a local image. */
  contentImage?: string;
  /** URL to open on click. */
  open?: string;
  /** Notifications in the same group replace each other. */
  group?: string;
  /** Removes the notifications of this group, or `ALL`. */
  remove?: string;
  /** Lists the notifications of this group, or `ALL`. */
  list?: string;
  /** Bundle identifier of an app to activate on click. */
  activate?: string;
  /** Shell command to run on click. */
  execute?: string;
  ignoreDnD?: boolean;
  /** Action buttons. */
  actions?: string | string[];
  /** Adds a text field. A string is used as placeholder. */
  reply?: boolean | string;
  /** Seconds to wait for actions or reply, or `false` to wait forever. */
  timeout?: number | false;
}

/** `WindowsToaster` (Windows 8+), wrapping SnoreToast. */
export interface WindowsToasterNotification extends Notification {
  /** `true`, or a Windows sound such as `Notification.Mail`. */
  sound?: boolean | string;
  silent?: boolean;
  /** Action buttons. */
  actions?: string[];
  /** Your app's ID. Without it the toast shows "SnoreToast". */
  appID?: string;
  /** ID to use with `remove`. */
  id?: number;
  /** ID of a notification to close. */
  remove?: number;
  /** Same as `remove`. */
  close?: number;
  /** About 7 seconds for `short` (the default), about 25 for `long`. */
  duration?: 'short' | 'long';
  /** Creates a Start menu shortcut for `appID`. */
  install?: string;
  /** Executable to start when clicked after node-notifier stopped listening. */
  application?: string;
  timeout?: number | false;
  /** Overrides the constructor's `customPath`. */
  customPath?: string;
}

/** `WindowsBalloon` (Windows < 8), wrapping notifu. */
export interface WindowsBalloonNotification extends Notification {
  /** Milliseconds to show the balloon. */
  time?: number;
  type?: 'info' | 'warn' | 'error';
  /** Set to `false` to play a sound. */
  quiet?: boolean;
}

/** Options for the `NotifySend` constructor. */
export interface NotifySendOptions extends NotifierOptions {
  /** Skip checking that notify-send is installed. */
  suppressOsdCheck?: boolean;
}

/** `NotifySend` (Linux), wrapping notify-send. */
export interface NotifySendNotification extends Notification {
  /** Seconds before the notification expires, or `false` for the default. */
  timeout?: number | false;
  /** Action buttons. Requires notify-send 0.7.10+. */
  actions?: string | string[];
  /** Don't keep the notification in the notification history. */
  transient?: boolean;
  'app-name'?: string;
  urgency?: 'low' | 'normal' | 'critical';
  category?: string;
  hint?: string;
}

/** Options for the `Growl` constructor. */
export interface GrowlOptions extends NotifierOptions {
  /** Application name registered with Growl. */
  name?: string;
  host?: string;
  port?: number;
}

/** `Growl`, wrapping growly. */
export interface GrowlNotification extends Omit<Notification, 'icon'> {
  /** Path to an icon, or its contents. */
  icon?: string | Buffer;
  sticky?: boolean;
  label?: string;
  priority?: number;
  coalescingId?: string;
}

/** Options of any notifier, as accepted by the default notifier. */
export type AnyNotification =
  | NotificationCenterNotification
  | WindowsToasterNotification
  | WindowsBalloonNotification
  | NotifySendNotification
  | GrowlNotification;

/** A notifier class that accepts the options of any notifier. */
export type NotifierClass = CallableClass<
  new (
    options?: NotifierOptions
  ) => Notifier<AnyNotification>
>;
