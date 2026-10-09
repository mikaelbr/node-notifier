export function argsListHas(args, field) {
  return args.includes(field);
}

export function getOptionValue(args, field) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === field && i < args.length - 1) {
      return args[i + 1];
    }
  }
}
