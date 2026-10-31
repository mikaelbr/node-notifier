# Contributing

node-notifier love getting pull requests and other help. Here's a quick guide.

## Debugging

If you want to see what command is run, execute the node program with the environmental variable `DEBUG="notifier"`, e.g.:

```
DEBUG="notifier" node example/message.ts
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

Install dependencies (the repo uses pnpm via [Corepack](https://github.com/nodejs/corepack)):

```shell
corepack enable
pnpm install
```

The source is TypeScript in `src/`. Node runs it directly through its built-in
type stripping, so the examples in `example/` and the tests need no build step.

```shell
pnpm test        # vitest, including type tests in test/*.test-d.ts
pnpm lint        # biome
pnpm typecheck   # tsc
pnpm build       # tsdown -> dist/, also run on pack/publish
node example/message.ts
```

Make your change. Add tests for your change. Make the checks above pass.

Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/mikaelbr/node-notifier/compare/
