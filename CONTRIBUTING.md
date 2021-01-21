# Contributing

node-notifier love getting pull requests and other help. Here's a quick guide.

## Debugging

If you want to see what command is run, execute the node program with the environmental variable `DEBUG="notifier"`, e.g.:

```
DEBUG="notifier" node index.js
```

```
node-notifier debug info (fileCommandJson):
[notifier path] /Users/mib/node-notifier/vendor/mac.noindex/terminal-notifier.app/Contents/MacOS/terminal-notifier
[notifier options] -message "Hello" -timeout "5" -json "true"
```


## Building

Fork, then clone the repo:

```
git clone https://github.com/your-username/node-notifier.git
```

Install dependencies:

```shell
npm install
```

Make sure the tests pass:

```shell
npm test
```

Make your change. Add tests for your change. Make the tests pass:

```shell
npm test
```

Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/mikaelbr/node-notifier/compare/
