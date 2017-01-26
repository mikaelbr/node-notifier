var path = require('path');
var fs = require('fs');
var _ = require('../lib/utils');

describe('utils', function() {
  describe('clone', function() {
    it('should clone nested objects', function() {
      var obj = { a: { b: 42 }, c: 123 };
      var obj2 = _.clone(obj);

      expect(obj).toEqual(obj2);
      obj.a.b += 2;
      obj.c += 2;
      expect(obj).not.toEqual(obj2);
    });
  });

  describe('mapping', function() {
    it('should map icon for notify-send', function() {
      var expected = { title: 'Foo', message: 'Bar', icon: 'foobar' };

      expect(
        _.mapToNotifySend({ title: 'Foo', message: 'Bar', appIcon: 'foobar' })
      ).toEqual(expected);

      expect(
        _.mapToNotifySend({ title: 'Foo', message: 'Bar', i: 'foobar' })
      ).toEqual(expected);
    });

    it('should map short hand for notify-sned', function() {
      var expected = {
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

    it('should map icon for notification center', function() {
      var expected = {
        title: 'Foo',
        message: 'Bar',
        appIcon: 'foobar',
        json: true
      };

      expect(
        _.mapToMac({ title: 'Foo', message: 'Bar', icon: 'foobar' })
      ).toEqual(expected);

      expect(
        _.mapToMac({ title: 'Foo', message: 'Bar', i: 'foobar' })
      ).toEqual(expected);
    });

    it('should map icon for growl', function() {
      var icon = path.join(__dirname, 'fixture', 'coulson.jpg');
      var iconRead = fs.readFileSync(icon);

      var expected = { title: 'Foo', message: 'Bar', icon: iconRead };

      var obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', icon: icon });
      expect(obj).toEqual(expected);

      expect(obj.icon).toBeTruthy();
      expect(Buffer.isBuffer(obj.icon)).toBeTruthy();

      obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', appIcon: icon });

      expect(obj.icon).toBeTruthy();
      expect(Buffer.isBuffer(obj.icon)).toBeTruthy();
    });

    it('should not map icon url for growl', function() {
      var icon = 'http://hostname.com/logo.png';

      var expected = { title: 'Foo', message: 'Bar', icon: icon };

      expect(
        _.mapToGrowl({ title: 'Foo', message: 'Bar', icon: icon })
      ).toEqual(expected);

      expect(
        _.mapToGrowl({ title: 'Foo', message: 'Bar', appIcon: icon })
      ).toEqual(expected);
    });
  });
});
