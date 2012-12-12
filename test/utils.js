var utils = require('../lib/utils')
	, should = require('should')
	, assert = require('assert');

var sampleData = "GroupID	Title	Subtitle	Message	Delivered At\n" +
"1	FOo bar	What here	My message	2012-12-12 12:42:28 +0000\n" +
"(null)	Some application's message	What here	Hello there!!	2012-12-12 12:40:34 +0000\n" +
"(null)	Some application's message	(null)	Hello there!!	2012-12-12 12:40:07 +0000\n" +
"(null)	Some application	(null)	Hello there!!	2012-12-12 12:39:46 +0000\n" +
"(null)	Some application	(null)	Hello there!!	2012-12-12 12:39:25 +0000\n" +
"(null)	Some application	(null)	Hello there!!	2012-12-12 12:38:22 +0000\n" +
"(null)	Some application	(null)	Hello there!!	2012-12-12 12:38:04 +0000\n" +
"(null)	Terminal	(null)	Hello there!!	2012-12-12 12:37:54 +0000\n" +
"(null)	Some	(null)	Hello	2012-12-12 12:34:16 +0000\n" +
"(null)	Some	(null)	Hello	2012-12-12 12:32:31 +0000\n" +
"(null)	Some%20app	(null)	Hello	2012-12-12 12:32:12 +0000\n" +
"(null)	Some	(null)	Hello	2012-12-12 12:31:59 +0000\n" +
"(null)	Terminal	(null)	Hello	2012-12-12 12:31:32 +0000\n" +
"(null)	Terminal	(null)	Hello	2012-12-12 12:30:39 +0000";

var sampleDelivered = "* Notification delivered."
	, sampleRemoved = "* Removing previously sent notification, which was sent on: 2012-12-12 14:22:26 +0000";

describe('utils', function(){

	describe('#parseCLIOutput()', function(){

		it('should should extract delivered and classify it as type delivered', function(done){

			var res = utils.parseCLIOutput(sampleDelivered);
			res.type.should.equal("delivered");
			res.response[0].should.equal("Notification delivered.");
			done();

		});


		it('should should extract removed and classify it as type removed', function(done){

			var res = utils.parseCLIOutput(sampleRemoved);
			res.type.should.equal("removed");
			res.response[0].should.equal("Removing previously sent notification, which was sent on: 2012-12-12 14:22:26 +0000");
			done();

		});


		it('should should extract list and classify it as type list', function(done){

			var res = utils.parseCLIOutput(sampleData);

			res.response.length.should.equal(14);
			res.type.should.equal("list");
			res.response[0].GroupID.should.equal(1);
			done();
		});

	});
});