"use strict";

var wiki = require('./../lib/wiki');
var peg = require('../lib/peg');
var should = require('should');

function dump(obj) {
    console.log("result = " + wiki.dump(obj));
}

function render(result) {
    var renderedText = "";
    result.data.render(function (text) {
        renderedText += text;
    });
    return renderedText;
}

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
                result.data.nodeType.should.equal('link');
            });

            it('should have a render method on result', function () {
                var result = wiki.parsers.link(text);
                result.data.render.should.be.instanceof(Function);
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
                result.data.nodeType.should.equal('text');
            });

            it('should have a render method on result', function () {
                var result = wiki.parsers.text(text);
                result.data.render.should.be.instanceof(Function);
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
                result.data.nodeType.should.equal('text');
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
                result.data.nodeType.should.equal('link');
            });
        });
    });

    describe("paragraph", function () {
        describe("given plain text", function () {
            var text = {
                text: "This is ordinary text\n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.paragraph(text).matched.should.be.true;
            });

            it('should render wrapped in a p tag', function () {
                var result = wiki.parsers.paragraph(text);
                var resultText = render(result);

                resultText.should.match(/^<p>.*<\/p>$/);
                resultText.should.match(/This is ordinary text/);
            });
        });

        describe("Given text with bold, italics and links", function () {
            var text = {
                text: "This is *bold text* that /LinksSomewhere important/\n" +
                "and DoesMore on a *second line*\n",
                index: 0
            };

            it('should match the first line', function () {
                var result = wiki.parsers.paragraph(text);
                result.matched.should.be.true;

                result.consumed.should.equal(text.text.indexOf('\n') + 1);
            });

            it('should render properly nested', function() {
                
                var result = wiki.parsers.paragraph(text);
                var resultText = render(result);

                resultText.should.match(/^<p>.*<b>bold text<\/b>.*<i>.*<a.*>.*<\/a>.*<\/i><\/p>/);
            });

        });
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
                result.data.nodeType.should.equal('bold');
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

            it('should render text plus links in bold', function () {
                var result = wiki.parsers.bold(text);
                var resultText = render(result);

                resultText.should.match(/^<b>.*<\/b>$/);
                resultText.should.match(/This text/);
                resultText.should.match(/too/);
                resultText.should.match(/<a.*>LinksSomewhere<\/a>/);
                resultText.should.match(/<a.*>SomewhereElse<\/a>/);
            });
        });

        describe("given text that's missing bold end", function () {
            var text = {
                text: "*This is bold text\n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.bold(text).matched.should.be.true;
            });

            it('should match text up to end of line', function () {
                wiki.parsers.bold(text).text.should.equal("This is bold text");
            });
        });

        describe("given text that includes italic text", function () {
            var text = {
                text: "*this is bold /and emphasised/ too*",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.bold(text).matched.should.be.true;
            });

            it('should render italic text in italics', function () {
                var resultText = render(wiki.parsers.bold(text));

                resultText.should.match(/^<b>.*<\/b>$/);
                resultText.should.match(/<i>and emphasised<\/i>/);
            });

        });

        describe("Given text that drops the end italics", function () {
            var text = {
                text: "*this is bold /and emphasised too*",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.bold(text).matched.should.be.true;
            });

            it('should close the italics and bold in the correct order', function () {
                var resultText = render(wiki.parsers.bold(text));

                resultText.should.match(/^<b>.*<i>.*<\/i><\/b>$/);
            });
        });
    });

    describe('italics', function () {
        describe('given inline text', function () {
            var text = {
                text: "/This is italic text/ with non italics following",
                index: 0
            };

            it('should match the italics text', function () {
                var result = wiki.parsers.italics(text);
                result.matched.should.be.true;
                result.text.should.equal("This is italic text");
            });

            it('should return node type as italics', function () {
                var result = wiki.parsers.italics(text);
                result.data.nodeType.should.equal('italics');
            });
        });

        describe('given text with links', function () {
            var text = {
                text: "/This text LinksSomewhere and SomewhereElse too/",
                index: 0
            };

            it('should match all the text', function () {
                var result = wiki.parsers.italics(text);
                result.matched.should.be.true;
                result.consumed.should.equal(text.text.length);
            });

            it('should render text plus links in italics', function () {
                var resultText = render(wiki.parsers.italics(text));

                resultText.should.match(/^<i>.*<\/i>$/);
                resultText.should.match(/This text/);
                resultText.should.match(/too/);
                resultText.should.match(/<a.*>LinksSomewhere<\/a>/);
                resultText.should.match(/<a.*>SomewhereElse<\/a>/);
            });
        });

        describe("given text that's missing italics end", function () {
            var text = {
                text: "/This is italic text\r\n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.italics(text).matched.should.be.true;
            });

            it('should match text up to end of line', function () {
                wiki.parsers.italics(text).text.should.equal("This is italic text");
            });
        });

        describe("given text that includes bold text", function () {
            var text = {
                text: "/this is italic *and bold* too/",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.italics(text).matched.should.be.true;
            });

            it('should render bold text in bold', function () {
                var resultText = render(wiki.parsers.italics(text));

                resultText.should.match(/^<i>.*<\/i>$/);
                resultText.should.match(/<b>and bold<\/b>/);
            });

        });

        describe("Given text that drops the end bold", function () {
            var text = {
                text: "/this is italic *and bold too/",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.italics(text).matched.should.be.true;
            });

            it('should close the italics and bold in the correct order', function () {
                var resultText = render(wiki.parsers.italics(text));

                resultText.should.match(/^<i>.*<b>.*<\/b><\/i>$/);
            });
        });
    });

    describe('header', function () {
        describe('given four exclamation marks', function () {
            var text = {
                text: "!!!! A header!\n",
                index: 0
            };

            it('should match', function () {
                var result = wiki.parsers.header(text);
                result.matched.should.be.true;
            });

            it('should render as h1', function () {
                var resultText = render(wiki.parsers.header(text));

                resultText.should.match(/^<h1>.*<\/h1>$/);
            });
        });

        describe('given three exclamation marks', function () {
            var text = {
                text: "!!! A header!\n",
                index: 0
            };

            it('should match', function () {
                var result = wiki.parsers.header(text);
                result.matched.should.be.true;
            });

            it('should render as h2', function () {
                var resultText = render(wiki.parsers.header(text));

                resultText.should.match(/^<h2>.*<\/h2>$/);
            });
        });

        describe('given two exclamation marks', function () {
            var text = {
                text: "!! A header!\n",
                index: 0
            };

            it('should match', function () {
                var result = wiki.parsers.header(text);
                result.matched.should.be.true;
            });

            it('should render as h3', function () {
                var resultText = render(wiki.parsers.header(text));

                resultText.should.match(/^<h3>.*<\/h3>$/);
            });
        });
    });

    describe('eating whitespace', function () {

        it('should match whitespace', function () {
            var parser = peg.oneOrMore(peg.seq(wiki.parsers.spacing, wiki.parsers.eol));

            var text = {
                text: "  \r\n  \r\n\r\n",
                index: 0
            };

            var result = parser(text);
            result.matched.should.be.true;
            result.consumed.should.equal(text.text.length);

        });
    });

    describe("block", function () {
        describe("given header", function () {
            var text = {
                text: "!!!! Welcome to the /wiki/\r\n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.block(text).matched.should.be.true;
            });

            it('should render as a header', function () {
                var renderedText = render(wiki.parsers.block(text));

                renderedText.should.match(/^<h1>Welcome to the <i>wiki<\/i><\/h1>$/);
            });
        });

        describe('given text', function () {
            var text = {
                text:"This is *not a header*, LookAtHeaders instead\r\n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.block(text).matched.should.be.true;
            });

            it('should render as a paragraph', function () {
                var renderedText = render(wiki.parsers.block(text));
                renderedText.should.match(/^<p>.*<\/p>$/);
            });
        });

        describe("given text with extra blank lines and whitespace", function () {
            var text = {
                text: "This is some text\n\n   \n",
                index: 0
            };

            it('should match', function () {
                wiki.parsers.block(text).matched.should.be.true;
            });

            it('should consume the trailing whitespace', function () {
                wiki.parsers.block(text).consumed.should.equal(text.text.length);
            });
        })
    });

    describe('htmlText', function () {
        describe('given a full set of text', function () {
            var text = {
                text: "!!!! Welcome to the Wiki Test suite\n" +
                "This is /sample text/ to demonstrate that we match" +
                " multiple blocks.\n" +
                "\r\n\r\n" +
                "*This should be a second block\n" +
                "!! with a small header at the end\n",
                index: 0
            };

            it('should match', function () {
                var parser = wiki.parsers.htmlText;
                var result = parser(text);
                result.matched.should.be.true;
                result.consumed.should.equal(text.text.length);
            });

            it('should render in a div', function () {
                var resultText = render(wiki.parsers.htmlText(text));
                resultText.should.match(/^<div>.*<\/div>/);
            });
        });
    })
});
