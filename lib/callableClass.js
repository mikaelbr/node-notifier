// Notifier classes have always been callable without `new`. Classes throw
// when called, so forward plain calls to the constructor.
export default function callableClass(Class) {
  return new Proxy(Class, {
    apply: (Target, _thisArg, args) => new Target(...args)
  });
}
