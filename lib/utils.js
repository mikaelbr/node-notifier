var child_process = require('child_process')
  , exec = child_process.exec
  , osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher'
  , shellwords = require('shellwords');

var escapeQuotes = function (str) {
  if (typeof str === 'string') {
    return str.replace(/\"/g, '\\"');
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
    if (stdout >= "10.8") {
      return cb(false);
    }

    return cb(true, osVersionError);
  });
};


// Parsing CLI lines and tables..
var tableLineObject = function (header, splittedLine) {
  var obj = {}, line;
  for(var i = 0, len = header.length; i < len; i++) {
    line = splittedLine[i].trim();

    if (i === len-1) {
      line = new Date(line);
    }
    else if (line === "(null)") {
      line = null;
    }
    else if (!!parseInt(line, 10)) {
      line = parseInt(line, 10);
    }


    obj[header[i]] = line;
  }
  return obj;
};

module.exports.parseCLIOutput = function (data) {
  if (!data) {
    return data;
  }

  var lines = data.trim().split("\n"), i, len, base = {
    response: []
  };

  // Check for single line.
  if (lines.length === 1 && lines[0].substring(0,1) === '*') {
    var msg = lines[0].substring(1).trim();
    base.response.push(msg);

    var type = msg.substring(0, 4).toLowerCase();

    // Set type
    if (type === "noti") {
      base.type = 'delivered';
    }
    else if (type === "remo") {
      base.type = 'removed';
    }

    return base;
  }

  // Multiple lines in listing
  if (lines.length > 0 && lines[0].substring(0,4).toLowerCase() === "grou") {
    var header = lines[0].split("\t");
    for (i = 1, len = lines.length; i < len; i++) {
      base.response.push(tableLineObject(header, lines[i].split("\t")));
    }

    base.type = 'list';
    return base;
  }

  // Remove ALL
  if (lines.length > 0) {
    for (i = 0, len = lines.length; i < len; i++) {
      base.response.push(lines[i].substring(1).trim());
    }

    base.type = 'removed';
    return base;
  }

  return data;
};
