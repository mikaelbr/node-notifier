var child_process = require('child_process')
  , exec = child_process.exec
  , osVersionError = 'Incorrect OS. node-notify requires Mac OS 10.8 or higher';


module.exports.command = function (notifier, options, cb) {
  var notifyApp = exec(notifier + ' ' + options.join(' '), function (error, stdout, stderr) {
    if (error !== null) {
      return cb(error);
    }

    cb(stderr, stdout);
  }); 

  return notifyApp;
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