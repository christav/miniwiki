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

    describe("link", function () {
        describe("passed ordinary text", function () {
            it('should not match', function () {
                var text = "This is not a wikiword";
                var result = wiki.parsers.link({text: text, index: 0});

                result.matched.should.be.false;
            });
        });

        describe('passed a WikiWord', function () {
            var text;

            beforeEach(function () {
                text = {
                    text: "ThisIsSomeWikiWord",
                    index: 0
                };
            });

            it('should match', function () {
                var result = wiki.parsers.link(text);
                result.matched.should.be.true;
            });

            it('should return "link" as node type', function () {
                var result = wiki.parsers.link(text);
                result.result.nodeType.should.equal('link');
            });

            it('should have a render method on result', function () {
                var result = wiki.parsers.link(text);
                result.result.render.should.be.instanceof(Function);
            });
        });
    });
});


