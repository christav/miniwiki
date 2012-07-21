// Function library for dealing with wikitext
// to html formatting

(function () {
	var _ = require("underscore");
	var peg = require("../peg");

//
// PEG Parser for the wiki markup
//
// HTMLText <- Block* END
// Block <- Header / Paragraph
// Header <- HeaderIntro InlineContent* EOL
// HeaderIntro <- (H1 / H2 / H3) Spacing
// Paragraph <- InlineContent* EOL
// InlineContent <- Bold / Italics / Link / Text
// Bold <- BoldDelim (!BoldEnd InlineContent)+ BoldEnd
// Italics <- ItalicsDelim (!ItalicsEnd InlineContent)+ ItalicsEnd
// Link <- CapWord CapWord+
// Text <- (!EOL .)+
// CapWord <- InitialCap lowercase+
// BoldDelim <- "*"
// BoldEnd <- BoldDelim / &EOL
// ItalicsDelim <- "/"
// ItalicsEnd <- ItalicDelim / &EOL
// H1 <- "!!!!"
// H2 <- "!!!"
// H3 <- "!!"
// InitialCap <- [A-Z]
// Lowercase <- [a-z]
// Spacing <- Whitespace*
// Whitespace <- "  / "\t"
// EOL <- \r\n / \n / END

var eol = peg.firstOf(peg.match("\r\n"), peg.match("\n"), peg.end());
var whitespace = peg.firstOf(peg.match(" "), peg.match("\t"));
var spacing = whitespace.zeroOrMore();
var lowercase = peg.match(/[a-z]/);
var initialCap = peg.match(/[A-Z]/);
var h3 = peg.match("!!");
var h2 = peg.match("!!!");
var h1 = peg.match("!!!!");
var italicsEnd = peg.firstOf(peg.match("/"), peg.and(eol));
var boldEnd = peg.firstOf(peg.match("*"), peg.and(eol));
var capWord = peg.seq(initialCap, lowercase.oneOrMore());
var text = peg.seq(peg.not(eol), peg.any).oneOrMore();
var link = peg.seq(capWord, capWord.oneOrMore());
var inlineContent;
var italics = peg.seq(peg.match('/'), peg.seq(peg.not(italicsEnd), inlineContent).oneOrMore(), italicsEnd);
var bold = peg.seq(peg.match('*', peg.seq(peg.not(boldEnd), inlineContent).oneOrMore(), boldEnd));
inlineContent = peg.firstOf(bold, italics, link, text);
var paragraph = peg.seq(inlineContent.zeroOrMore(), eol);
var headerIntro = peg.seq(peg.firstOf(h1, h2, h3), spacing);
var header = peg.seq(headerIntro, inlineContent.zeroOrMore(), eol);
var block = peg.firstOf(header, paragraph);
var htmlText = peg.seq(block.zeroOrMore(), peg.end);

	_.extend(exports, {
		parsers: {
			eol: eol 
		}
	});

})();
