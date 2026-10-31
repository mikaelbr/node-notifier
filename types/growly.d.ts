// Only the parts of growly that node-notifier uses.
declare module 'growly' {
  interface Growly {
    appname: string;
    host: string | undefined;
    port: number | undefined;
    setHost(host?: string, port?: number): void;
    notify(
      text: string,
      options?: Record<string, unknown>,
      callback?: (err: Error | null, action?: string) => void
    ): void;
  }

  const growly: Growly;
  export default growly;
}
