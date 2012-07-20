var peg = require('../lib/peg'),
 assert = require('should');

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

        it('should fail match if string matches', function () {
            var parser = peg.not(peg.matchString('bc'));
            parser({text: "abc", index: 1}).matched.should.be.false;
        });
    });

    describe("match string", function () {
        it('should match the string given', function () {
            var parser = peg.matchString('bc');
            parser({text: "abc", index: 1}).matched.should.be.true;
        });

        it("should not match if string isn't matched", function () {
            var parser = peg.matchString('ac');
            parser({text: "abc", index: 1}).matched.should.be.false;
        });
    });
});
