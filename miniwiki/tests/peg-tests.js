var peg = require('../lib/peg'),
 assert = require('should');

describe("Parser utils", function () {
    
    describe("match any", function () {
        it('should match if there are characters in the string', function () {
            peg.any()({ text: "abc", index: 0}).should.have.property("matched", true);
        });
        
        it('should match the correct character', function () {
            peg.any()({ text: "abc", index: 1}).should.have.property("text", "b");
        });

        it('should consume one character', function () {
            peg.any()({ text: "abc", index: 0}).should.have.property("consumed", 1);
        });

        it('should not match if all characters have been consumed', function () {
            peg.any()({text: "abc", index: 3}).should.have.property("matched", false);
        });

        it('should invoke callback on successful match', function () {
            var called = false;
            peg.any().then(function (parseResult) {
                called = true;
            })({ text: "qed", index: 0});
            called.should.be.true;
        });

        it('should not invoke callback on failed match', function () {
            var called = false;
            peg.any().then(function (parseResult) {
                called = true;
            })({ text: "", index: 0});
            called.should.be.false;
        });

        it('should let callback set the parse result', function () {
            var result = peg.any().then(function (parseResult) {
                parseResult.result = "this is my new result";
            })({ text: "this is some text", index: 2});
            result.result.should.equal("this is my new result");
        });
    });

    describe("match end", function () {

        it('should match at end of input', function () {
            var result = peg.end({text: "abc", index: 3});
            result.matched.should.be.true;
        });

        if('should not match when not at end', function () {
            var result = peg.end({text: "abcd", index: 2});
            result.matched.should.be.false;
        });

        it('should invoke callback on match', function () {
            var called = false;
            peg.end({text: "", index: 0}, function () { called = true; });
            called.should.be.true;
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

        it("should invoke callback on match", function () {
            var called = false;
            peg.match("ab", function (parseResult) { called = true; })({ text: "abc", index: 0});
            called.should.be.true;
        });
    });

    describe("match regex", function () {
        it('should match when created with regex', function () {
            var parser = peg.match(/[ab]/);
            parser({ text: "bba", index: 1}).matched.should.be.true;
        });

        it("should not match if regex match doesn't start at current location", function () {
            var parser = peg.match(/cd/);
            parser({ text: "abcde", index: 1}).matched.should.be.false;
        });

        it("should return correct matched text", function () {
            var parser = peg.match(/bcd/);
            parser({ text: "abcdef", index: 1}).text.should.equal("bcd");
        });

        it("should consume entire matched text", function () {
            var parser = peg.match(/bcd/);
            parser({ text: "abcdef", index: 1}).consumed.should.equal(3);
        });

        it("should invoke callback on successful match", function () {
            var called = false;
            peg.match(/[ab]/, function (parseResult) { called = true; })( { text: "abcd", index: 0 } );
            called.should.be.true;
        });
    })


    describe("not operator", function () {
        it('should make any match at end of string', function () {
            var parser = peg.not(peg.any());
            parser({text: "abc", index: 3}).matched.should.be.true;
        });

        it('should fail match if string matches', function () {
            var parser = peg.not(peg.match('bc'));
            parser({text: "abc", index: 1}).matched.should.be.false;
        });

        it('should invoke callback on successful match', function () {
            var called = false;
            peg.not(peg.any(), function () { called = true; })({ text: "abc", index: 3 });
            called.should.be.true;
        });
    });

    describe("and operator", function () {
        it('should match', function () {
            var parser = peg.and(peg.any());
            parser({ text: "abc", index: 0}).matched.should.be.true;
        });

        it('should not consume when matching', function () {
            var parser = peg.and(peg.any());
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
