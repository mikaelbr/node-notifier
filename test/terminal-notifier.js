var notifier = require('../')
  , should = require('should')
  , assert = require('assert');

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
});