var cp = require('child_process'),
    os = require('os'),
    fs = require('fs'),
    osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher',
    shellwords = require('shellwords'),
    semver = require('semver'),
    clone = require('clone');


var escapeQuotes = function (str) {
  if (typeof str === 'string') {
    return str.replace(/(["$`\\])/g, '\\$1');
  } else {
    return str;
  }
};

var inArray = function (arr, val) {
  for(var i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      return true;
    }
  }
  return false;
};

var notifySendFlags = {
  "u":            "urgency",
  "urgency":      "urgency",
  "t":            "expire-time",
  "e":            "expire-time",
  "expire":       "expire-time",
  "expire-time":  "expire-time",
  "i":            "icon",
  "icon":         "icon",
  "c":            "category",
  "category":     "category",
  "h":            "hint",
  "hint":         "hint"
};

module.exports.command = function (notifier, options, cb) {
  return cp.exec(shellwords.escape(notifier) + ' ' + options.join(' '), function (error, stdout, stderr) {
    if (error) return cb(error);
    cb(stderr, stdout);
  });
};

module.exports.windowsCommand = function (notifier, options, cb) {
  return cp.execFile(notifier, options, function (error, stdout, stderr) {
    if (error) return cb(error, stdout);
    cb(stderr, stdout);
  });
};

var mapAppIcon = function (options) {
  if (options.appIcon) {
    options.icon = options.appIcon;
    delete options.appIcon;
  }

  return options;
};

var mapText = function (options) {
  if (options.text) {
    options.message = options.text;
    delete options.text;
  }

  return options;
};

var mapIconShorthand = function (options) {
  if (options.i) {
    options.icon = options.i;
    delete options.i;
  }

  return options;
};

module.exports.mapToNotifySend = function (options) {
  options = mapAppIcon(options);
  options = mapText(options);

  for (var key in options) {
    if (key === "message" || key === "title") continue;
    if (options.hasOwnProperty(key) && (notifySendFlags[key] != key)) {
      options[notifySendFlags[key]] = options[key];
      delete options[key];
    }
  }

  return options;
};

module.exports.mapToGrowl = function (options) {
  options = mapAppIcon(options);
  options = mapIconShorthand(options);

  if (options.text) {
    options.message = options.text;
    delete options.text;
  }

  if (options.icon && !Buffer.isBuffer(options.icon)) {
    options.icon = fs.readFileSync(options.icon);
  }

  return options;
};

module.exports.mapToMac = function (options) {
  options = mapIconShorthand(options);
  options = mapText(options);

  if (options.icon) {
    options.appIcon = options.icon;
    delete options.icon;
  }

  return options;
};

module.exports.actionJackerDecorator = function (emitter, options, fn, mapper) {
  options = clone(options);
  fn = (fn || function (err, data) {}).bind(emitter);
  return function (err, data) {
    fn(err, data);
    if (err || !mapper || !data) return;

    var key = mapper(data);
    if (!key) return;
    emitter.emit(key, emitter, options);
  };
};


module.exports.constructArgumentList = function (options, extra) {
  var args = [];
  extra = extra || {};

  // Massive ugly setup. Default args
  var initial = extra.initial || [];
  var keyExtra = extra.keyExtra || "";
  var allowedArguments = extra.allowedArguments || [];
  var noEscape = extra.noEscape !== void 0;
  var checkForAllowed = extra.allowedArguments !== void 0;
  var wrapper = extra.wrapper === void 0 ? '"' : extra.wrapper;

  var escapeFn = noEscape ? function (i) { return i; } : escapeQuotes;

  initial.forEach(function (val) {
    args.push(wrapper + escapeFn(val) + wrapper);
  });
  for(var key in options) {
    if (options.hasOwnProperty(key) && (!checkForAllowed || inArray(allowedArguments, key))) {
      args.push('-' + keyExtra + key, wrapper + escapeFn(options[key]) + wrapper);
    }
  }
  return args;
};

module.exports.mapToWin8 = function (options){

  options = mapAppIcon(options);
  options = mapText(options);

  if(options.icon){
    options.p = options.icon;
    delete options.icon;
  }

  if(options.message){
    options.m = options.message;
    delete options.message;
  }

  if (options.title) {
    options.t = options.title;
    delete options.title;
  }

  return options;
};

module.exports.mapToNotifu = function (options) {
  options = mapAppIcon(options);
  options = mapText(options);

  if(options.icon){
    options.i = options.icon;
    delete options.icon;
  }

  if(options.message){
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

  if (options.t) {
    options.d = options.t;
    delete options.t;
  }

  return options;
};

module.exports.isMac = function() {
  return os.type() === 'Darwin';
};

module.exports.isMountainLion = function() {
  return os.type() === 'Darwin' && semver.satisfies(garanteeSemverFormat(os.release()), '>=12.0.0');
};

module.exports.isWin8 = function() {
  return os.type() === 'Windows_NT' && semver.satisfies(garanteeSemverFormat(os.release()), '>=6.2.9200');
};

module.exports.isLessThanWin8 = function() {
  return os.type() === 'Windows_NT' && semver.satisfies(garanteeSemverFormat(os.release()), '<6.2.9200');
};


function garanteeSemverFormat (version) {
  if (version.split('.').length === 2) {
    version += '.0';
  }
  return version;
}
