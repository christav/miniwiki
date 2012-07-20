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

describe("Parser utils", function () {
    describe("match any", function () {
        it('should match if there are characters in the string', function () {
            peg.any({ text: "abc", index: 0}).should.have.property("matched", true);
        });
        it('should match the correct character', function () {
            peg.any({ text: "abc", index: 1}).should.have.property("text", "b");
        });
        it('should consume one character', function () {
            peg.any({ text: "abc", index: 0}).should.have.property("consumed", 1);
        });
        it('should not match if all characters have been consumed', function () {
            peg.any({text: "abc", index: 3}).should.have.property("matched", false);
        });
    });

    describe("not", function () {
        it('should make any match at end of string', function () {
            var parser = peg.not(peg.any);
            parser({text: "abc", index: 3}).should.have.property("matched", true);
        });
    });

    describe("match string", function () {
        it('should match the string given', function () {
            var parser = peg.matchString('bc');
            parser({text: "abc", index: 1}).should.have.property("matched", true);
        });
    });
});
