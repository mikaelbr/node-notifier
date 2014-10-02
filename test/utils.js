var should = require('should'),
    path = require('path'),
    os = require('os'),
    fs = require('fs');

var _ = require('../lib/utils');

describe('utils', function(){

  describe('mapping', function () {

    it('should map icon for notify-send', function () {
      var expected = {
        title: 'Foo',
        message: 'Bar',
        icon: 'foobar'
      };

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

    it('should map short hand for notify-sned', function () {
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

    it('should map icon for notification center', function () {
      var expected = {
        title: 'Foo',
        message: 'Bar',
        appIcon: 'foobar'
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

    it('should map icon for growl', function () {
      var icon = path.join(__dirname, 'fixture', 'coulson.jpg');
      var iconRead = fs.readFileSync(icon);

      var expected = {
        title: 'Foo',
        message: 'Bar',
        icon: fs.readFileSync(icon)
      };

      var obj = _.mapToGrowl({
        title: 'Foo',
        message: 'Bar',
        icon: icon
      });

      obj.should.have.property('icon');
      (Buffer.isBuffer(obj.icon)).should.be.true;

      var obj = _.mapToGrowl({
        title: 'Foo',
        message: 'Bar',
        appIcon: icon
      });

      obj.should.have.property('icon');
      (Buffer.isBuffer(obj.icon)).should.be.true;
    });

  });

});
