import { afterEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import _ from '../lib/utils.js';

describe('utils', function () {
  describe('clone', function () {
    it('should clone nested objects', function () {
      const obj = { a: { b: 42 }, c: 123 };
      const obj2 = _.clone(obj);

      expect(obj).toEqual(obj2);
      obj.a.b += 2;
      obj.c += 2;
      expect(obj).not.toEqual(obj2);
    });
  });

  describe('mapping', function () {
    it('should map icon for notify-send', function () {
      const expected = {
        title: 'Foo',
        message: 'Bar',
        icon: 'foobar',
        'expire-time': 10000
      };

      expect(
        _.mapToNotifySend({ title: 'Foo', message: 'Bar', appIcon: 'foobar' })
      ).toEqual(expected);

      expect(
        _.mapToNotifySend({ title: 'Foo', message: 'Bar', i: 'foobar' })
      ).toEqual(expected);
    });

    it('should map short hand for notify-sned', function () {
      const expected = {
        urgency: 'a',
        'expire-time': 'b',
        category: 'c',
        icon: 'd',
        hint: 'e'
      };

      expect(
        _.mapToNotifySend({ u: 'a', e: 'b', c: 'c', i: 'd', h: 'e' })
      ).toEqual(expected);
    });

    it('should drop icon for notification center', function () {
      const expected = { title: 'Foo', message: 'Bar' };

      expect(
        _.mapToMac({ title: 'Foo', message: 'Bar', icon: 'foobar' })
      ).toEqual(expected);

      expect(_.mapToMac({ title: 'Foo', message: 'Bar', i: 'foobar' })).toEqual(
        expected
      );
    });

    it('should map icon for growl', function () {
      const icon = path.join(import.meta.dirname, 'fixture', 'coulson.jpg');
      const iconRead = fs.readFileSync(icon);

      const expected = { title: 'Foo', message: 'Bar', icon: iconRead };

      let obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', icon: icon });
      expect(obj).toEqual(expected);

      expect(obj.icon).toBeTruthy();
      expect(Buffer.isBuffer(obj.icon)).toBeTruthy();

      obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', appIcon: icon });

      expect(obj.icon).toBeTruthy();
      expect(Buffer.isBuffer(obj.icon)).toBeTruthy();
    });

    it('should not map icon url for growl', function () {
      const icon = 'http://hostname.com/logo.png';

      const expected = { title: 'Foo', message: 'Bar', icon: icon };

      expect(
        _.mapToGrowl({ title: 'Foo', message: 'Bar', icon: icon })
      ).toEqual(expected);

      expect(
        _.mapToGrowl({ title: 'Foo', message: 'Bar', appIcon: icon })
      ).toEqual(expected);
    });
  });

  describe('createNamedPipe', function () {
    afterEach(function () {
      vi.restoreAllMocks();
    });

    it('should listen exclusively on the pipe path', async function () {
      const listen = vi
        .spyOn(net.Server.prototype, 'listen')
        .mockImplementation(function (options, cb) {
          cb();
          return this;
        });
      const server = { namedPipe: '\\\\.\\pipe\\notifierPipe-123' };

      await _.createNamedPipe(server);

      expect(listen).toHaveBeenCalledTimes(1);
      expect(listen.mock.calls[0][0]).toEqual({
        path: '\\\\.\\pipe\\notifierPipe-123',
        exclusive: true
      });
    });
  });

  describe('mapToWin8 icon', function () {
    const isWSL = _.isWSL;
    afterEach(function () {
      _.isWSL = isWSL;
    });

    function iconFor(icon, wsl) {
      _.isWSL = () => wsl;
      const mapped = _.mapToWin8({ title: 'Foo', message: 'Bar', icon });
      expect(mapped.icon).toBeUndefined();
      return mapped.p;
    }

    it('should convert /mnt/<drive>/ paths under WSL', function () {
      expect(iconFor('/mnt/c/Users/me/icon.png', true)).toBe(
        'C:\\Users\\me\\icon.png'
      );
    });

    it('should convert file:///mnt/<drive>/ URLs under WSL', function () {
      expect(iconFor('file:///mnt/d/icons/icon.png', true)).toBe(
        'D:\\icons\\icon.png'
      );
    });

    it('should keep Windows paths under WSL', function () {
      expect(iconFor('C:\\icon.png', true)).toBe('C:\\icon.png');
      expect(iconFor('file:///C:/icons/icon.png', true)).toBe(
        'C:\\icons\\icon.png'
      );
    });

    it('should drop icons not on a Windows drive under WSL', function () {
      for (const icon of [
        '/home/me/icon.png',
        'icon.png',
        './icon.png',
        'http://example.com/icon.png',
        'file:///home/me/icon.png',
        '/mnt/c',
        '/mnt/c/',
        '/mnt/cdrom/icon.png',
        '/mnt/C/icon.png',
        '/mnt/c/../../etc/icon.png',
        'file:///mnt/c/../../home/me/icon.png',
        '\\\\wsl$\\Ubuntu\\home\\me\\icon.png'
      ]) {
        expect(iconFor(icon, true), icon).toBeUndefined();
      }
    });

    it('should not change icons outside WSL', function () {
      expect(iconFor('/mnt/c/Users/me/icon.png', false)).toBe(
        '/mnt/c/Users/me/icon.png'
      );
      expect(iconFor('/home/me/icon.png', false)).toBe('/home/me/icon.png');
      expect(iconFor('file:///C:/icons/icon.png', false)).toBe(
        'C:\\icons\\icon.png'
      );
    });
  });
});
