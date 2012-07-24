"use strict";

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

    describe("text", function () {
        describe("when given ordinary text", function () {
            var text;

            beforeEach(function () {
                text = {
                    text: "This is some plain text",
                    index: 0
                };
            });

            it('should match', function () {
                var result = wiki.parsers.text(text);
                result.matched.should.be.true;
            });

            it('should match entire text', function () {
                var result = wiki.parsers.text(text);
                result.text.should.equal(text.text);
            });

            it('should return "text" as node type', function () {
                var result = wiki.parsers.text(text);
                result.result.nodeType.should.equal('text');
            });

            it('should have a render method on result', function () {
                var result = wiki.parsers.text(text);
                result.result.render.should.be.instanceof(Function);
            });
        });

        describe('when given text with embedded link', function () {
            var text;

            beforeEach(function () {
                text = {
                    text: "This is a WikiWord going somewhere else",
                    index: 0
                };
            });

            it('should match', function () {
                wiki.parsers.text(text).matched.should.be.true;
            });

            it('should match up to the link', function () {
                wiki.parsers.text(text).text.should.equal("This is a ");
            });
        });

        describe('when embedding text with bold', function () {
            var text;

            beforeEach(function () {
                text = {
                    text: "This has *bold statements* in it",
                    index: 0
                };
            });

            it('should match up to the bold', function () {
                var result = wiki.parsers.text(text);
                result.matched.should.be.true;
                result.text.should.equal("This has ");
            });
        });

        describe('when embedding text with italics', function () {
            var text;

            beforeEach(function () {
                text = {
                    text: "This has /emphasized statements/ in it",
                    index: 0
                };
            });

            it('should match up to the italics', function () {
                var result = wiki.parsers.text(text);
                result.matched.should.be.true;
                result.text.should.equal("This has ");
            });
        });

    });


    describe('inline content', function () {
        describe("given plain text", function () {

            var text = {
                text: "This is some plain text",
                index: 0
            };

            it('should return plain text', function () {
                var result = wiki.parsers.inlineContent(text);

                result.matched.should.be.true;
                result.text.should.equal(text.text);
                result.result.nodeType.should.equal('text');
            });
        });

        describe('given a link', function () {
            var text = {
                text: "WikiWord links somewhere",
                index: 0
            };

            it('should match and return the link', function (){
                var result = wiki.parsers.inlineContent(text);

                result.matched.should.be.true;
                result.text.should.equal("WikiWord");
                result.result.nodeType.should.equal('link');
            });
        })
    });

    describe('bold', function () {
        describe('given inline text', function () {
            var text = {
                text: "*This is bold text* with non bold following",
                index: 0
            };

            it('should match the bold text', function () {
                var result = wiki.parsers.bold(text);
                result.matched.should.be.true;
                result.text.should.equal("This is bold text");
            });

            it('should return node type as bold', function () {
                var result = wiki.parsers.bold(text);

                result.result.nodeType.should.equal('bold');
            });
        });

        describe('given text with links', function () {
            var text = {
                text: "*This text LinksSomewhere and SomewhereElse too*",
                index: 0
            };

            it('should match all the text', function () {
                var result = wiki.parsers.bold(text);
                result.matched.should.be.true;
                result.consumed.should.equal(text.text.length);
            });
        });
    });
});


