import cp from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import isWsl from 'is-wsl';

// Exported as a single object, and always called through it, so tests can
// replace individual functions.

const BUFFER_SIZE = 1024;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function escapeQuotes(str) {
  return typeof str === 'string' ? str.replace(/(["$`\\])/g, '\\$1') : str;
}

const notifySendFlags = {
  u: 'urgency',
  urgency: 'urgency',
  t: 'expire-time',
  time: 'expire-time',
  timeout: 'expire-time',
  e: 'expire-time',
  expire: 'expire-time',
  'expire-time': 'expire-time',
  i: 'icon',
  icon: 'icon',
  c: 'category',
  category: 'category',
  subtitle: 'category',
  h: 'hint',
  hint: 'hint',
  a: 'app-name',
  'app-name': 'app-name'
};

function debug(name, notifier, options) {
  if (!process.env.DEBUG?.includes('notifier')) return;
  console.info(`node-notifier debug info (${name}):`);
  console.info('[notifier path]', notifier);
  if (options) console.info('[notifier options]', options.join(' '));
}

function command(notifier, options, cb) {
  debug('command', notifier, options);
  return cp.exec(
    `${notifier} ${options.join(' ')}`,
    (error, stdout, stderr) => {
      if (error) return cb(error);
      cb(stderr, stdout);
    }
  );
}

// Same callback contract as `command`, but runs the binary directly without a
// shell, so argument values can never be interpreted as shell syntax.
function commandWithoutShell(notifier, options, cb) {
  debug('commandWithoutShell', notifier, options);
  return cp.execFile(notifier, options, (error, stdout, stderr) => {
    if (error) return cb(error);
    cb(stderr, stdout);
  });
}

function fileCommand(notifier, options, cb) {
  debug('fileCommand', notifier, options);
  return cp.execFile(notifier, options, (error, stdout, stderr) => {
    if (error) return cb(error, stdout);
    cb(stderr, stdout);
  });
}

function immediateFileCommand(notifier, options, cb) {
  debug('notifier', notifier);

  notifierExists(notifier, (_, exists) => {
    if (!exists) {
      return cb(new Error(`Notifier (${notifier}) not found on system.`));
    }
    cp.execFile(notifier, options);
    cb();
  });
}

function notifierExists(notifier, cb) {
  return fs.stat(notifier, (err, stat) => {
    if (!err) return cb(err, stat.isFile());

    // Check if Windows alias
    if (path.extname(notifier)) {
      // Has extension, no need to check more
      return cb(err, false);
    }

    // Check if there is an exe file in the directory
    return fs.stat(`${notifier}.exe`, (err, stat) => {
      if (err) return cb(err, false);
      cb(err, stat.isFile());
    });
  });
}

function mapAppIcon(options) {
  if (options.appIcon) {
    options.icon = options.appIcon;
    delete options.appIcon;
  }

  return options;
}

function mapText(options) {
  if (options.text) {
    options.message = options.text;
    delete options.text;
  }

  return options;
}

function mapIconShorthand(options) {
  if (options.i) {
    options.icon = options.i;
    delete options.i;
  }

  return options;
}

function mapToNotifySend(options) {
  options = mapAppIcon(options);
  options = mapText(options);

  if (options.timeout === false) {
    delete options.timeout;
  }
  if (options.wait === true) {
    options['expire-time'] = 5; // 5 seconds default time (multipled below)
  }
  for (const key in options) {
    if (key === 'message' || key === 'title') continue;
    const flag = Object.hasOwn(notifySendFlags, key)
      ? notifySendFlags[key]
      : undefined;
    if (Object.hasOwn(options, key) && flag !== key) {
      options[flag] = options[key];
      delete options[key];
    }
  }
  if (options['expire-time'] === undefined) {
    options['expire-time'] = 10 * 1000; // 10 sec timeout by default
  } else if (typeof options['expire-time'] === 'number') {
    options['expire-time'] = options['expire-time'] * 1000; // notify send uses milliseconds
  }

  return options;
}

function mapToGrowl(options) {
  options = mapAppIcon(options);
  options = mapIconShorthand(options);
  options = mapText(options);

  if (options.icon && !Buffer.isBuffer(options.icon)) {
    try {
      options.icon = fs.readFileSync(options.icon);
    } catch {}
  }

  return options;
}

function mapToMac(options) {
  options = mapIconShorthand(options);
  options = mapText(options);

  // terminal-notifier 3 can't set a custom icon or sender, and warns on stderr
  // if asked to. Neither has had an effect since macOS 11.
  delete options.icon;
  delete options.appIcon;
  delete options.sender;
  // No longer supported by terminal-notifier 3.
  delete options.closeLabel;
  delete options.dropdownLabel;

  if (typeof options.actions === 'string') {
    options.actions = [options.actions];
  }

  if (options.reply === true) {
    options.reply = '';
  } else if (options.reply === false) {
    delete options.reply;
  }

  if (options.sound === true) {
    options.sound = 'Bottle';
  }

  if (options.sound === false) {
    delete options.sound;
  }

  if (options.sound && options.sound.indexOf('Notification.') === 0) {
    options.sound = 'Bottle';
  }

  if (options.wait === true) {
    if (!options.timeout) {
      options.timeout = 5;
    }
    delete options.wait;
  }

  if (!options.wait && !options.timeout) {
    if (options.timeout === false) {
      delete options.timeout;
    } else {
      options.timeout = 10;
    }
  }

  // terminal-notifier only waits for a response when there is something to
  // respond to, so a timeout means nothing without actions or reply.
  if (!options.actions && options.reply === undefined) {
    delete options.timeout;
  }

  return options;
}

function noop() {}

function actionJackerDecorator(emitter, options, fn, mapper) {
  options = clone(options);
  fn = fn || noop;

  if (typeof fn !== 'function') {
    throw new TypeError(
      `The second argument must be a function callback. You have passed ${typeof fn}`
    );
  }

  return (err, data) => {
    let resultantData = data;
    let metadata = {};
    // Allow for extra data if resultantData is an object
    if (resultantData && typeof resultantData === 'object') {
      metadata = resultantData;
      resultantData = resultantData.activationType;
    }

    // Sanitize the data
    if (resultantData) {
      resultantData = resultantData.toLowerCase().trim();
      if (/^activate|clicked$/.test(resultantData)) {
        resultantData = 'activate';
      }
      if (/^timedout$/.test(resultantData)) {
        resultantData = 'timeout';
      }
    }

    fn.apply(emitter, [err, resultantData, metadata]);
    if (!mapper || !resultantData) return;

    const key = mapper(resultantData);
    if (!key) return;
    emitter.emit(key, emitter, options, metadata);
  };
}

function constructArgumentList(options, extra = {}) {
  const args = [];

  // Massive ugly setup. Default args
  const initial = extra.initial || [];
  const keyExtra = extra.keyExtra || '';
  const allowedArguments = extra.allowedArguments || [];
  const noEscape = extra.noEscape !== undefined;
  const checkForAllowed = extra.allowedArguments !== undefined;
  const explicitTrue = !!extra.explicitTrue;
  const keepNewlines = !!extra.keepNewlines;
  const wrapper = extra.wrapper === undefined ? '"' : extra.wrapper;

  const escapeFn = (arg) => {
    if (Array.isArray(arg)) {
      return removeNewLines(arg.map(escapeFn).join(','));
    }

    if (!noEscape) {
      arg = escapeQuotes(arg);
    }
    if (typeof arg === 'string' && !keepNewlines) {
      arg = removeNewLines(arg);
    }
    return wrapper + arg + wrapper;
  };

  for (const val of initial) {
    args.push(escapeFn(val));
  }
  for (const key in options) {
    if (
      Object.hasOwn(options, key) &&
      (!checkForAllowed || allowedArguments.includes(key))
    ) {
      if (explicitTrue && options[key] === true) {
        args.push(`-${keyExtra}${key}`);
      } else if (explicitTrue && options[key] === false) continue;
      else args.push(`-${keyExtra}${key}`, escapeFn(options[key]));
    }
  }
  return args;
}

function removeNewLines(str) {
  const escapedNewline = process.platform === 'win32' ? '\\r\\n' : '\\n';
  return str.replace(/\r?\n/g, escapedNewline);
}

/*
---- Options ----
[-t] <title string>     | Displayed on the first line of the toast.
[-m] <message string>   | Displayed on the remaining lines, wrapped.
[-b] <button1;button2 string>| Displayed on the bottom line, can list multiple buttons separated by ";"
[-tb]                   | Displayed a textbox on the bottom line, only if buttons are not presented.
[-p] <image URI>        | Display toast with an image, local files only.
[-id] <id>              | sets the id for a notification to be able to close it later.
[-s] <sound URI>        | Sets the sound of the notifications, for possible values see http://msdn.microsoft.com/en-us/library/windows/apps/hh761492.aspx.
[-silent]               | Don't play a sound file when showing the notifications.
[-appID] <App.ID>       | Don't create a shortcut but use the provided app id.
[-pid] <pid>            | Query the appid for the process <pid>, use -appID as fallback. (Only relevant for applications that might be packaged for the store)
[-pipeName] <\.\pipe\pipeName\> | Provide a name pipe which is used for callbacks.
[-application] <C:\foo.exe>     | Provide a application that might be started if the pipe does not exist.
-close <id>             | Closes a currently displayed notification.
*/
const allowedToasterFlags = [
  't',
  'm',
  'b',
  'tb',
  'p',
  'id',
  's',
  'silent',
  'appID',
  'pid',
  'pipeName',
  'close',
  'install',
  'application'
];
const toasterSoundPrefix = 'Notification.';
const toasterDefaultSound = 'Notification.Default';

function mapToWin8(options) {
  options = mapAppIcon(options);
  options = mapText(options);

  if (options.icon) {
    if (/^file:\/+/.test(options.icon)) {
      // should parse file protocol URL to path
      options.p = new URL(options.icon).pathname
        .replace(/^\/(\w:\/)/, '$1')
        .replace(/\//g, '\\');
    } else {
      options.p = options.icon;
    }
    delete options.icon;
  }

  if (options.message) {
    // Remove escape char to debug "HRESULT : 0xC00CE508" exception
    options.m = options.message.replace(/\x1b/g, '');
    delete options.message;
  }

  if (options.title) {
    options.t = options.title;
    delete options.title;
  }

  if (options.appName) {
    options.appID = options.appName;
    delete options.appName;
  }

  if (options.remove !== undefined) {
    options.close = options.remove;
    delete options.remove;
  }

  if (options.quiet || options.silent) {
    options.silent = options.quiet || options.silent;
    delete options.quiet;
  }

  if (options.sound !== undefined) {
    options.s = options.sound;
    delete options.sound;
  }

  if (options.s === false) {
    options.silent = true;
    delete options.s;
  }

  // Silent takes precedence. Remove sound.
  if (options.s && options.silent) {
    delete options.s;
  }

  if (options.s === true) {
    options.s = toasterDefaultSound;
  }

  if (options.s && options.s.indexOf(toasterSoundPrefix) !== 0) {
    options.s = toasterDefaultSound;
  }

  // Without a value, SnoreToast would read the next flag as the application.
  if (typeof options.application !== 'string' || !options.application) {
    delete options.application;
  }

  if (options.actions && Array.isArray(options.actions)) {
    options.b = options.actions.join(';');
    delete options.actions;
  }

  for (const key in options) {
    // Check if is allowed. If not, delete!
    if (Object.hasOwn(options, key) && !allowedToasterFlags.includes(key)) {
      delete options[key];
    }
  }

  return options;
}

function mapToNotifu(options) {
  options = mapAppIcon(options);
  options = mapText(options);

  if (options.icon) {
    options.i = options.icon;
    delete options.icon;
  }

  if (options.message) {
    options.m = options.message;
    delete options.message;
  }

  if (options.title) {
    options.p = options.title;
    delete options.title;
  }

  if (options.time) {
    options.d = options.time;
    delete options.time;
  }

  if (options.q !== false) {
    options.q = true;
  } else {
    delete options.q;
  }

  if (options.quiet === false) {
    delete options.q;
    delete options.quiet;
  }

  if (options.sound) {
    delete options.q;
    delete options.sound;
  }

  if (options.t) {
    options.d = options.t;
    delete options.t;
  }

  if (options.type) {
    options.t = sanitizeNotifuTypeArgument(options.type);
    delete options.type;
  }

  return options;
}

function isMac() {
  return os.type() === 'Darwin';
}

// macOS 10.14 is Darwin 18, the minimum for terminal-notifier 3.
function isMojaveOrLater() {
  return os.type() === 'Darwin' && releaseSatisfies('>=', '18.0.0');
}

function isWin8() {
  return os.type() === 'Windows_NT' && releaseSatisfies('>=', '6.2.9200');
}

function isWSL() {
  return isWsl;
}

function isLessThanWin8() {
  return os.type() === 'Windows_NT' && releaseSatisfies('<', '6.2.9200');
}

function guaranteeSemverFormat(version) {
  if (version.split('.').length === 2) {
    version += '.0';
  }
  return version;
}

function parseVersion(version) {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(\+.*)?$/.exec(
    version.trim()
  );
  return match ? match.slice(1, 4).map(Number) : null;
}

// Compares os.release() against a version. Unparseable or pre-release
// versions never satisfy, matching semver.satisfies.
function releaseSatisfies(operator, version) {
  const current = parseVersion(guaranteeSemverFormat(os.release()));
  if (!current) return false;
  const target = parseVersion(version);
  let diff = 0;
  for (let i = 0; i < 3 && diff === 0; i++) diff = current[i] - target[i];
  return operator === '<' ? diff < 0 : diff >= 0;
}

function sanitizeNotifuTypeArgument(type) {
  if (typeof type === 'string' || type instanceof String) {
    const lower = type.toLowerCase();
    if (lower === 'info' || lower === 'warn' || lower === 'error') return lower;
  }

  return 'info';
}

function createNamedPipe(server) {
  const buf = Buffer.alloc(BUFFER_SIZE);

  return new Promise((resolve) => {
    server.instance = net.createServer((stream) => {
      stream.on('data', (c) => {
        buf.write(c.toString());
      });
      stream.on('end', () => {
        server.instance.close();
      });
    });
    server.instance.listen(server.namedPipe, () => {
      resolve(buf);
    });
  });
}

const utils = {
  clone,
  command,
  commandWithoutShell,
  fileCommand,
  immediateFileCommand,
  mapToNotifySend,
  mapToGrowl,
  mapToMac,
  isArray: Array.isArray,
  actionJackerDecorator,
  constructArgumentList,
  mapToWin8,
  mapToNotifu,
  isMac,
  isMojaveOrLater,
  isWin8,
  isWSL,
  isLessThanWin8,
  createNamedPipe
};

export default utils;
