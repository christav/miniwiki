var wiki = require('./../lib/wiki');
var peg = require('../lib/peg');
var should = require('should');

describe("Libraries", function () {
    describe("Wiki library", function () {
        it("should be present", function () {
            wiki.should.be.a('object');
        });
    });
});

describe("Wiki Markup parser", function () {
    describe("EOL", function () {
        it('should match end of line', function () {
            wiki.parsers.eol({ text: "\r\n", index: 0}).matched.should.be.true;
        });

        it('should not match not end of line', function () {
            wiki.parsers.eol({text: "something", index: 5}).matched.should.be.false;
        });

        it('should match end of input without consuming anything', function () {
            var result = wiki.parsers.eol({ text: "something", index: "something".length});
            result.matched.should.be.true;
            result.consumed.should.equal(0);
        });
    });

    function ignoreThis() {
    describe('inlineContent', function () {
        describe('passed ordinary text', function () {
            var textToParse;

            beforeEach(function () {
                textToParse = {
                    text: "This is some ordinary text",
                    index: 0
                };
            });

            it('should match when given regular text', function () {
                wiki.parsers.inlineContent(textToParse).matched.should.be.true;
            });

            it('should match the entire text', function () {
                wiki.parsers.inlineContent(textToParse).text.should.equal(textToParse.text);
            });

            it('should have text node as parse result', function () {
                var result = wiki.parsers.inlineContent(textToParse);

                should.exist(result.result);
                result.result.nodeType.should.equal("text");
            });
        });
    });
    }
});


