import { describe, expectTypeOf, it } from 'vitest';
import notifier, {
  type DefaultNotifier,
  Growl,
  type NotificationCallback,
  NotificationCenter,
  type NotificationMetadata,
  type Notifier,
  NotifySend,
  notify,
  WindowsBalloon,
  WindowsToaster
} from '../src/index.ts';
import NotifySendDirect from '../src/notifiers/notifysend.ts';

describe('public types', () => {
  it('exports the default notifier with all notifiers attached', () => {
    expectTypeOf(notifier).toEqualTypeOf<DefaultNotifier>();
    expectTypeOf(notifier.NotificationCenter).toEqualTypeOf<
      typeof NotificationCenter
    >();
    expectTypeOf(notify).toEqualTypeOf<DefaultNotifier['notify']>();
  });

  it('accepts options of any notifier on the default notifier', () => {
    notifier.notify('Message');
    notifier.notify({ message: 'x', actions: ['OK'], urgency: 'low' });
    notifier.notify({ message: 'x', duration: 'long', sticky: true });
  });

  it('passes error, response and metadata to the callback', () => {
    expectTypeOf<Parameters<NotificationCallback>>().toEqualTypeOf<
      [
        err: Error | null,
        response?: string | undefined,
        metadata?: NotificationMetadata | undefined
      ]
    >();
  });

  it('has classes usable as types, with and without new', () => {
    const nc: NotificationCenter = new NotificationCenter();
    expectTypeOf(NotificationCenter()).toEqualTypeOf<NotificationCenter>();
    expectTypeOf(nc.clearAll).toEqualTypeOf<() => void>();
    expectTypeOf(new WindowsToaster()).toExtend<Notifier>();
    expectTypeOf(new WindowsBalloon()).toExtend<Notifier>();
    expectTypeOf(new Growl({ name: 'app' })).toExtend<Notifier>();
    expectTypeOf(NotifySendDirect).toEqualTypeOf<typeof NotifySend>();
  });

  it('notify returns a notifier to chain event listeners on', () => {
    expectTypeOf(
      new NotifySend().notify('hi').on('click', () => {})
    ).toExtend<Notifier>();
  });

  it('checks notifier specific options', () => {
    // @ts-expect-error urgency is low, normal or critical
    new NotifySend().notify({ urgency: 'urgent' });
    // @ts-expect-error duration is short or long
    new WindowsToaster().notify({ duration: 10 });
    // @ts-expect-error type is info, warn or error
    new WindowsBalloon().notify({ type: 'fatal' });
    new NotificationCenter().notify({ reply: 'Placeholder', timeout: false });
  });
});
