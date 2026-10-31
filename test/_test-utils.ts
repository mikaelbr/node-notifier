export function argsListHas(args: readonly string[], field: string): boolean {
  return args.includes(field);
}

export function getOptionValue(
  args: readonly string[],
  field: string
): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === field && i < args.length - 1) {
      return args[i + 1];
    }
  }
}
