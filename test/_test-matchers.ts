import { expect } from 'vitest';

declare module 'vitest' {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>> {
    toEndWith(expected: string): R;
  }
}

expect.extend({
  toEndWith(received: string, expected: string) {
    const pass = received.endsWith(expected);
    const message = () =>
      `expected ${received} ${pass ? 'not ' : ''} to end with ${expected}`;
    return { message, pass };
  }
});
