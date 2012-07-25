var peg = require('../lib/peg'),
 should = require('should');

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

    describe("match end", function () {

        it('should match at end of input', function () {
            var result = peg.end({text: "abc", index: "abc".length});
            result.matched.should.be.true;
        });

        if('should not match when not at end', function () {
            var result = peg.end({text: "abcd", index: 2});
            result.matched.should.be.false;
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
    });


    describe("not operator", function () {
        it('should make any match at end of string', function () {
            var parser = peg.not(peg.any);
            parser({text: "abc", index: 3}).matched.should.be.true;
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

    describe("sequence operator", function () {
        it('should match two in order', function () {
            var parser = peg.seq(peg.match('one'), peg.match("two"));
            var result = parser({text: "onetwo", index: 0});

            result.matched.should.be.true;
        });

        it('should match the entire string', function () {
            var parser = peg.seq(peg.match('one'), peg.match("two"));
            var result = parser({text: "onetwo", index: 0});

            result.text.should.equal("onetwo");
        });

        it('should consume entire matched string from input', function () {
            var parser = peg.seq(peg.match('one'), peg.match('two'));
            var result = parser({ text: "onetwo", index: 0});

            result.consumed.should.equal(6);
        });

        it('should include results of each internal match in results', function () {
            var parser = peg.seq(peg.match('one'), peg.match('two'));
            var result = parser({ text: "onetwo", index: 0});

            result.result[0].text.should.equal('one');
            result.result[1].text.should.equal('two');            
        });

        it("should not match if second one doesn't match", function () {
            var parser = peg.seq(peg.match('one'), peg.match('two'));
            var result = parser({ text: "onethreeFive", index: 0});

            result.matched.should.be.false;
        });

        it('should return array of results for all matching subparsers when matched', function () {
            var text = {
                text: "one two five no three",
                index: 0
            };

            var parser = peg.seq(
                peg.onMatch(peg.match("one "), function (result) {
                    result.result = "first";
                }),
                peg.onMatch(peg.match("two "), function (result) {
                    result.result = 2;
                }),
                peg.onMatch(peg.match("five"), function (result) {
                    result.result = "third";
                }));

            var result = parser(text);

            result.matched.should.be.true;
            result.result.length.should.equal(3);
            result.result[0].result.should.equal('first', "First item doesn't match");
            result.result[1].result.should.equal(2, "Second item doesn't match");
            result.result[2].result.should.equal('third', "Third item doesn't match");
        });
    });

    describe('firstOf operator', function () {

        it('should match if first expression matches', function () {
            var parser = peg.firstOf(peg.match('one'), peg.match('two'), peg.match('three'));
            parser({text: "one two three", index: 0}).matched.should.be.true;
        });

        it('should match if second expression matches', function () {
            var parser = peg.firstOf(peg.match('one'), peg.match('two'), peg.match('three'));
            var result = parser({text:"two three one", index: 0});
            result.matched.should.be.true;
            result.text.should.equal("two");
            result.consumed.should.equal(3);
        });

        it('should not match if no expression matches', function () {
            var parser = peg.firstOf(peg.match('one'), peg.match('two'), peg.match('three'));
            parser({text:"four shut the door", index: 0}).matched.should.be.false;            
        });

        it('should return result from matching parser', function () {
            var parser = peg.firstOf(peg.match('one'), 
                peg.onMatch(peg.match('two'), function (result) {
                    result.result = "I was matched";
                }), 
                peg.match('three'));
            var result = parser({text:"two three one", index: 0});

            result.result.should.equal("I was matched");
        });
    });

    describe('zeroOrMore operator', function () {
        it('should match when there is no match', function () {
            var parser = peg.zeroOrMore(peg.match("abc"));
            var result = parser({text: "xyz", index: 0});

            result.matched.should.be.true;
            result.consumed.should.equal(0);
            result.text.should.equal("");
        });

        it('should match where there are multiple matches', function () {
            var parser = peg.zeroOrMore(peg.match('ab'));
            var result = parser({text: "ababababcab", index: 0});

            result.matched.should.be.true;
            result.text.should.equal("abababab");
            result.consumed.should.equal(8);
        });

        it('should return array of results of all matches', function () {
            var count = 5,
                innerParser = peg.onMatch(peg.match('ab'), function (result) {
                    result.result = count;
                    count = count + 3;
                }),
                parser = peg.zeroOrMore(innerParser);

            var result = parser({text: "abababc", index: 0});

            result.matched.should.be.true;
            result.result.should.be.an.instanceof(Array);
            result.result.length.should.equal(3);

            result.result[0].result.should.equal(5);
            result.result[1].result.should.equal(8);
            result.result[2].result.should.equal(11);
        });
    });

    describe("oneOrMore operator", function () {

        it('should match when there is multiple matches', function () {
            var parser = peg.oneOrMore(peg.match(/[0-9]/));
            var result = parser({text: "867-5309", index: 0});
            result.matched.should.be.true;
            result.text.should.equal("867");
            result.consumed.should.equal(3);
        });

        it('should match when there is one match', function () {
            var parser = peg.oneOrMore(peg.match(/[0-9]/));
            var result = parser({text: "1 2 buckle your shoe", index: 0});
            result.matched.should.be.true;
            result.text.should.equal("1");
            result.consumed.should.equal(1);
        });

        it("should not match when there's no match", function () {
            var parser = peg.oneOrMore(peg.match(/[0-9]/));
            var result = parser({text: "The number is 8675309", index: 0});

            result.matched.should.be.false;
        });
    
        it('should return array of results of all matches', function () {
            var count = 5,
                innerParser = peg.onMatch(peg.match('ab'), function (result) {
                    result.result = count;
                    count = count + 3;
                }),
                parser = peg.oneOrMore(innerParser);

            var result = parser({text: "abababc", index: 0});

            result.matched.should.be.true;
            result.result.should.be.an.instanceof(Array);
            result.result.length.should.equal(3);

            result.result[0].result.should.equal(5);
            result.result[1].result.should.equal(8);
            result.result[2].result.should.equal(11);
        });

    });

    describe('onMatch operator', function () {

        it('should invoke callback on successful match with result', function () {
            var expectedResult = {
                matched: true,
                text: "some text",
                consumed: "some text".length,
                result: null
            };

            peg.onMatch(function (input) {
                return expectedResult;
            }, function (result) {
                result.callbackWasInvoked = true;
            })();

            should.exist(expectedResult.callbackWasInvoked);
            expectedResult.callbackWasInvoked.should.be.true;
        });

        it('should not invoke callback on failed match', function () {
            var expectedResult = {
                matched: false,
                consumed: 0,
                result: null
            };

            peg.onMatch(function (input) {
                return expectedResult;
            }, function (result) {
                result.callbackWasInvoked = true;
            })();

            should.not.exist(expectedResult.callbackWasInvoked);
        });
    });
});
