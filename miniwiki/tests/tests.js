var wiki = require('./../lib/wiki');
var peg = require('../lib/peg');
var assert = require('should');

describe("Libraries", function () {
    describe("Wiki library", function () {
        it("should be present", function () {
            wiki.should.be.a('object');
        });
    });
});

describe("Wiki Markup", function () {
    describe("plain text", function () {
        it("should return a text node", function () {
            var result = wiki.parse("plain text");
            result.should.be.a("object");
            result.should.have.property("render");
        });

        it("should render as itself", function () {
            var source = "some plain text";
            wiki.parse(source).render().should.equal(source);
        });

    });
});


