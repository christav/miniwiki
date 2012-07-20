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

    describe("match string", function () {
        it('should match the string given', function () {
            var parser = peg.match('bc');
            parser({text: "abc", index: 1}).matched.should.be.true;
        });

        it("should not match if string isn't matched", function () {
            var parser = peg.match('ac');
            parser({text: "abc", index: 1}).matched.should.be.false;
        });

        it("should not match if string isn't matched at current location", function () {
            var parser = peg.match("bc");
            parser({text: "abc", index: 0}).matched.should.be.false;
        });
    });

    describe("not operator", function () {
        it('should make any match at end of string', function () {
            var parser = peg.not(peg.any);
            parser({text: "abc", index: 3}).should.have.property("matched", true);
        });

        it('should fail match if string matches', function () {
            var parser = peg.not(peg.match('bc'));
            parser({text: "abc", index: 1}).matched.should.be.false;
        });
    });

    describe("and operator", function () {
        it('should match', function () {
            var parser = peg.and(peg.any);
            parser({ text: "abc", index: 0}).matched.should.be.true;
        });

        it('should not consume when matching', function () {
            var parser = peg.and(peg.any);
            parser({text: "abc", index: 1}).consumed.should.equal(0);
        });

        it('should still match even when not consuming', function () {
            var parser = peg.and(peg.match("bc"));
            parser({text: "abcde", index: 1}).text.should.equal("bc");
        });

        it('should not match if inner parser doesn\'t match', function () {
            var parser = peg.and(peg.match("bc"));
            parser({text: "qed", index: 0}).matched.should.be.false;
        });
    });
});
