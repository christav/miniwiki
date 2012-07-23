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
// Text <- (!(EOL / BoldDelim / ItalicsDelim / Link) .)+
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
// Whitespace <- " " / "\t"
// EOL <- \r\n / \n / END

function link(input) {
	var parser = peg.onMatch(
		peg.seq(capWord, peg.oneOrMore(capWord)),
		function (result) {
			result.result = {
				nodeType: 'link',
				render: function (outputFunc) {

				}
			};
		});
	return parser(input);
}

function text(input) {
	var parser = peg.oneOrMore(
		peg.seq(
			peg.not(peg.firstOf(eol, boldDelim, italicsDelim, link)), 
			peg.any
		));

	var result = parser(input);
	if(result.matched) {
		result.result = {
			nodeType: 'text',
			render: function (outputFunc) {

			}
		};
	}
	return result;
}

function boldDelim(input) {
	var parser = peg.match('*');
	return parser(input);
}

function italicsDelim(input) {
	var parser = peg.match('/');
	return parser(input);
}

function capWord(input) {
	var parser = peg.seq(initialCap, peg.oneOrMore(lowercase));
	return parser(input);
}

function initialCap(input) {
	var parser = peg.match(/[A-Z]/);
	return parser(input);
}

function lowercase(input) {
	var parser = peg.match(/[a-z]/);
	return parser(input);
}

function spacing(input) {
	var parser = peg.zeroOrMore(whitespace);
	return parser(input);
}

function whitespace(input) {
	var parser = peg.firstOf(peg.match(" "), peg.match("\t"));
	return parser(input);
}

function eol(input) {
	var parser = peg.firstOf(peg.match('\r\n'), peg.match('\n'), peg.end);
	return parser(input);
}

(function () {
	// sock these away until replaced by the
	// fully function versions
var eol, whitespace, spacing, lowercase, initialCap,
	h3, h2, h1, italicsEnd, boldEnd, capWord, text,
	link, italics, bold, inlineContent, paragraph,
	headerIntro, header, block, htmlText;

eol = peg.firstOf(peg.match("\r\n"), peg.match("\n"), peg.end);
whitespace = peg.firstOf(peg.match(" "), peg.match("\t"));
spacing = peg.zeroOrMore(whitespace);
lowercase = peg.match(/[a-z]/);
initialCap = peg.match(/[A-Z]/);
h3 = peg.match("!!");
h2 = peg.match("!!!");
h1 = peg.match("!!!!");
italicsEnd = peg.firstOf(peg.match("/"), peg.and(eol));
boldEnd = peg.firstOf(peg.match("*"), peg.and(eol));
capWord = peg.seq(initialCap, peg.oneOrMore(lowercase));
text = peg.oneOrMore(peg.seq(
	peg.not(peg.seq(eol, bold, italics, link)),
	peg.any
	));
link = peg.seq(capWord, peg.oneOrMore(capWord));
italics = peg.seq(peg.match('/'), peg.oneOrMore(peg.seq(peg.not(italicsEnd), inlineContent)), italicsEnd);
bold = peg.seq(peg.match('*', peg.oneOrMore(peg.seq(peg.not(boldEnd), inlineContent)), boldEnd));
inlineContent = peg.firstOf(bold, italics, link, text);
paragraph = peg.seq(peg.zeroOrMore(inlineContent), eol);
headerIntro = peg.seq(peg.firstOf(h1, h2, h3), spacing);
header = peg.seq(headerIntro, peg.zeroOrMore(inlineContent), eol);
block = peg.firstOf(header, paragraph);
htmlText = peg.seq(peg.zeroOrMore(block), peg.end);
})();

	_.extend(exports, {
		parsers: {
			eol: eol,
			whitespace: whitespace,
			spacing: spacing,
			lowercase: lowercase,
			initialCap: initialCap,
			// h3 : h3,
			// h2 : h2,
			// h1 : h1,
			// italicsEnd: italicsEnd,
			// boldEnd: boldEnd,
			capWord: capWord,
			text: text,
			link: link,
			// inlineContent: inlineContent,
			// italics: italics,
			// bold: bold,
			// paragraph: paragraph,
			// headerIntro: headerIntro,
			// header: header,
			// block: block,
			// htmlText: htmlText
		}
	});

})();
