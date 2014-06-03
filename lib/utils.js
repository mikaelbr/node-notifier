var child_process = require('child_process')
  , exec = child_process.exec
  , osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher'
  , shellwords = require('shellwords');

var escapeQuotes = function (str) {
  if (typeof str === 'string') {
    return str.replace(/(["$`\\])/g, '\\$1');
  } else {
    return str;
  }
};

module.exports.command = function (notifier, options, cb) {
  var notifyApp = exec(shellwords.escape(notifier) + ' ' + options.join(' '), function (error, stdout, stderr) {
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

module.exports.isMacOSX = function (cb) {
  if (process.platform != 'darwin') {
    return cb(true, osVersionError);
  }

  return exec("sw_vers -productVersion", function (error, stdout, stderr) {
    if (error) {
      return cb(true, error, stderr);
    }
    if (stdout.split(".")[1] >= "8") {
      return cb(false);
    }

    return cb(true, osVersionError);
  });
};
