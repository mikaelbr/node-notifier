#!/usr/bin/env node

var notifier = require('./');
var minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  alias:  {
    'title': 't',
    'message': 'm'
  }
});

notifier.notify({
  title: argv.title,
  message: argv.message
});
