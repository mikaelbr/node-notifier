#!/usr/bin/env node

var notifier = require('./');
var minimist = require('minimist');
var usage = require('cli-usage');

var aliases = {
  'help': 'h',
  'title': 't',
  'subtitle': 'st',
  'message': 'm',
  'icon': 'i',
  'sound': 's',
  'open': 'o'
};

var argv = minimist(process.argv.slice(2), {
  alias: aliases,
  string: ['icon', 'message', 'open', 'subtitle', 'title']
});

readme(aliases);

var passedOptions = getOptionsIfExists(Object.keys(aliases), argv);
var stdinMessage = '';

process.stdin.on('readable', function(){
  var chunk = this.read();
  if (!chunk && !stdinMessage) {
    doNotification(passedOptions);
    this.end();
    return;
  }
  if (!chunk) return;
  stdinMessage += chunk.toString();
});

process.stdin.on('end', function(){
  if (stdinMessage) {
    passedOptions.message = stdinMessage;
  }
  doNotification(passedOptions);
});

function doNotification (options) {

  if (!options.message) {
    // Do not show an empty message
    process.exit(0);
  }
  notifier.notify(options, function (err, msg) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }

    if (!msg) return;
    console.log(msg);
    process.exit(0);
  });

}

function getOptionsIfExists(optionTypes, argv) {
  var options = {};
  optionTypes.forEach(function (key) {
    if (key && argv[key]) {
      options[key] = argv[key];
    }
  });
  return options;
}

function readme(input) {
  var str = '# notify\n \n## Options\n' + params(input) + '\n\n';
  str += '## Example\n```shell\n';
  str += '$ notify -t "Hello" -m "My Message" -s --open http://github.com\n';
  str += '$ notify -t "Agent Coulson" --icon https://raw.githubusercontent.com/mikaelbr/node-notifier/master/example/coulson.jpg \n';
  str += '$ notify -m "My Message" -s Glass\n';
  str += '$ echo "My Message" | notify -t "Hello"```\n\n';
  usage(str);
}

function params(input) {
  return Object.keys(input).reduce(function (acc, key) {
    return acc + ' * --' + key + ' (alias -' + input[key] + ')\n';
  }, '');
}
