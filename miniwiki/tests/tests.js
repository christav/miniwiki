var assert = require('should');

describe("Libraries", function () {
	describe("Wiki library", function () {
		it("should be present", function () {
			require("./../lib/wiki").should.be.a('object');
		});
	});
});

