var NotificationCenter = require('../').NotificationCenter
  , should = require('should')
  , os = require('os')
  , utils = require('../lib/utils')
  , assert = require('assert');

var notifier = new NotificationCenter();

(function () {

  if (os.type() !== 'Darwin') {
    return;
  }

  describe('node-notifier', function(){

    describe('#notify()', function(){

      before(function (done) {
        notifier.notify({
          remove: "ALL"
        }, function () { done(); });
      });

      it('should notify with a message', function(done){

        notifier.notify({
          message: "Hello World"
        }, function (err, response) {
          response.type.should.equal("delivered");
          done();
        });

      });

      it('should be chainable', function(done){

        notifier.notify({
          message: "First test"
        }).notify({
          message: "Second test"
        }, function (err, response) {
          response.type.should.equal("delivered");
          response.response[0].should.equal("Notification delivered.");
          done();
        });

      });

      it('should be able to list all notifications', function(done){
        notifier.notify({
            list: "ALL"
          }, function (err, response) {
            response.response.length.should.equal(3);
            done();
          });
      });


      it('should be able to remove all messages', function(done){
        notifier.notify({
          remove: "ALL"
        }, function (err, response) {
          response.type.should.equal("removed");

          notifier.notify({
            list: "ALL"
          }, function (err, response) {
            assert(!response);
            done();
          });
        });
      });
    });

    describe("arguments", function () {
      before(function () {
        this.original = utils.command;
      });

      after(function () {
        utils.command = this.original;
      });

      it('should allow for non-sensical arguments (fail gracefully)', function (done) {
        var expected = [ '-title', '"title"', '-message', '"body"', '-tullball', '"notValid"' ]

        utils.command = function (notifier, argsList, callback) {
          argsList.should.eql(expected);
          done();
        };

        var notifier = new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: "title",
          message: "body",
          tullball: "notValid"
        }, function (err) {
          should.not.exist(err);
          done();
        });
      });

      it('should escape all title andmessage', function (done) {
        var expected = [ '-title', '"title \\"message\\""',
        '-message', '"body \\"message\\""', '-tullball', '"notValid"' ]

        utils.command = function (notifier, argsList, callback) {
          argsList.should.eql(expected);
          done();
        };

        var notifier = new NotificationCenter();
        notifier.isNotifyChecked = true;
        notifier.hasNotifier = true;

        notifier.notify({
          title: 'title "message"',
          message: 'body "message"',
          tullball: "notValid"
        }, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });
}());
