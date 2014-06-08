var cp = require('child_process')
  , os = require('os')
  , osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher'
  , shellwords = require('shellwords')
  ;

var escapeQuotes = function (str) {
  if (typeof str === 'string') {
    return str.replace(/(["$`\\])/g, '\\$1');
  } else {
    return str;
  }
};

module.exports.command = function (notifier, options, cb) {
  var notifyApp = cp.exec(shellwords.escape(notifier) + ' ' + options.join(' '), function (error, stdout, stderr) {
    if (error) {
      return cb(error);
    }

    cb(stderr, stdout);
  });

  return notifyApp;
};

var inArray = function (arr, val) {
  for(var i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      return true;
    }
  }
  return false;
};

module.exports.constructArgumentList = function (options, initial, keyExtra, allowedArguments) {
  var args = [];
  keyExtra = keyExtra || "";
  var checkForAllowed = allowedArguments !== void 0;

  (initial || []).forEach(function (val) {
    args.push('"' + escapeQuotes(val) + '"');
  });
  for(var key in options) {
    if (options.hasOwnProperty(key) && (!checkForAllowed || inArray(allowedArguments, key))) {
      args.push('-' + keyExtra + key, '"' + escapeQuotes(options[key]) + '"');
    }
  }
  return args;
};

module.exports.getOSXVersion = function (cb) {
  return cp.exec("sw_vers -productVersion", cb);
}

module.exports.isMacOSX = function (cb) {
  if (os.type().toLowerCase() != 'darwin') {
    return cb(true, "You can't use the terminal-notifier reporter unless you are on a Mac.");
  }
  return module.exports.getOSXVersion(function (error, stdout, stderr) {
    if (error) {
      return cb(true, error, stderr);
    }
    if (Number(stdout.split(".")[1]) >= 8) {
      return cb(false);
    }

    return cb(true, osVersionError);
  });
};
