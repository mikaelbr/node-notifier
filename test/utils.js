var should = require('should');
var path = require('path');
var os = require('os');
var fs = require('fs');

var _ = require('../lib/utils');

describe('utils', function() {
  describe('clone', function() {
    it('should clone nested objects', function() {
      var obj = { a: { b: 42 }, c: 123 };
      var obj2 = _.clone(obj);

      obj.should.eql(obj2);
      obj.a.b += 2;
      obj.c += 2;
      obj.should.not.eql(obj2);
    });
  });

  describe('mapping', function() {
    it('should map icon for notify-send', function() {
      var expected = { title: 'Foo', message: 'Bar', icon: 'foobar' };

      _.mapToNotifySend({
        title: 'Foo',
        message: 'Bar',
        appIcon: 'foobar'
      }).should.eql(expected);

      _.mapToNotifySend({
        title: 'Foo',
        message: 'Bar',
        i: 'foobar'
      }).should.eql(expected);
    });

    it('should map short hand for notify-sned', function() {
      var expected = {
        urgency: 'a',
        'expire-time': 'b',
        category: 'c',
        icon: 'd',
        hint: 'e'
      };

      _.mapToNotifySend({
        u: 'a',
        e: 'b',
        c: 'c',
        i: 'd',
        h: 'e'
      }).should.eql(expected);
    });

    it('should map icon for notification center', function() {
      var expected = {
        title: 'Foo',
        message: 'Bar',
        appIcon: 'foobar',
        json: true
      };

      _.mapToMac({
        title: 'Foo',
        message: 'Bar',
        icon: 'foobar'
      }).should.eql(expected);

      _.mapToMac({
        title: 'Foo',
        message: 'Bar',
        i: 'foobar'
      }).should.eql(expected);
    });

    it('should map icon for growl', function() {
      var icon = path.join(__dirname, 'fixture', 'coulson.jpg');
      var iconRead = fs.readFileSync(icon);

      var expected = {
        title: 'Foo',
        message: 'Bar',
        icon: fs.readFileSync(icon)
      };

      var obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', icon: icon });

      obj.should.have.property('icon');
      Buffer.isBuffer(obj.icon).should.be.true;

      var obj = _.mapToGrowl({ title: 'Foo', message: 'Bar', appIcon: icon });

      obj.should.have.property('icon');
      Buffer.isBuffer(obj.icon).should.be.true;
    });

    it('should not map icon url for growl', function() {
      var icon = 'http://hostname.com/logo.png';

      var expected = { title: 'Foo', message: 'Bar', icon: icon };

      _.mapToGrowl({
        title: 'Foo',
        message: 'Bar',
        icon: icon
      }).should.eql(expected);

      _.mapToGrowl({
        title: 'Foo',
        message: 'Bar',
        appIcon: icon
      }).should.eql(expected);
    });
  });
});
