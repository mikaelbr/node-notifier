import type { CallableClass } from '../types.ts';

// Notifier classes have always been callable without `new`. Classes throw
// when called, so forward plain calls to the constructor.
export default function callableClass<
  C extends abstract new (
    ...args: never
  ) => unknown
>(Class: C): CallableClass<C> {
  return new Proxy(Class, {
    apply: (Target, _thisArg, args) =>
      Reflect.construct(Target as unknown as NewableFunction, args)
  }) as CallableClass<C>;
}
