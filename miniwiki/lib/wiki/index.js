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
// Text <- (!(EOL / Bold / Italics / Link) .)+
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

function htmlText(input) {
	var parser = peg.seq(peg.zeroOrMore(block), peg.end);
	return parser(input);
}

function block(input) {
	var parser = peg.firstOf(header, paragraph);
	return parser(input);
}

function header(input) {
	var parser = peg.seq(headerInto, peg.zeroOrMore(inlineContent), eol);
	return parser(input);
}

function headerIntro(input) {
	var parser = peg.seq(
		peg.firstOf(h1, h2, h3),
		spacing);
	return parser(input);
}

function paragraph(input) {
	var parser = peg.seq(peg.zeroOrMore(inlineContent), eol);
	return parser(input);
}

function inlineContent(input) {
	var parser = peg.firstOf(bold, italics, link, text);
	return parser(input);
}

function bold(input) {
	var parser = peg.seq(boldDelim, 
		peg.oneOrMore(peg.seq(peg.not(boldEnd), inlineContent)),
		boldEnd);
	return parser(input);
}

function italics(input) {
	var parser = peg.seq(italicsDelim, 
		peg.oneOrMore(peg.seq(peg.not(italicsEnd), inlineContent)),
		italicsEnd);
	return parser(input);
}

function link(input) {
	var parser = peg.seq(capWord, peg.oneOrMore(capWord));
	return parser(input);
}

function text(input) {
	var parser = peg.oneOrMore(
		peg.seq(
			peg.not(
				peg.firstOf(
					eol, bold, italics, link
				)
			), peg.any)
		);
	return parser(input);
}

function capWord(input) {
	var parser = peg.seq(initialCap, peg.oneOrMore(lowercase));
	return parser(input);
}

function boldDelim(input) {
	var parser = peg.match('*');
	return parser(input);
}

function boldEnd(input) {
	var parser = peg.firstOf(boldDelim, peg.and(eol));
	return parser(input);
}

function italicsDelim(input) {
	var parser = peg.match('/');
	return parser(input);
}

function italicsEnd(input) {
	var parser = peg.firstOf(italicsDelim, peg.and(eol));
	return parser(input);
}

function h1(input) {
	var parser = peg.match("!!!!");
	return parser(input);
}

function h2(input) {
	var parser = peg.match("!!!");
	return parser(input);
}

function h3(input) {
	var parser = peg.match("!!");
	return parser(input);
}

function initialCap(input) {
	var currentChar = input.text.charAt(input.index);

	if("ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(currentChar) !== -1)
	{
		return {
			matched: true,
			text: currentChar,
			consumed: 1,
			result: null
		};
	}

	return { matched: false, consumed: 0 };
}

function lowercase(input) {
	var parser = peg.not(initialCap);
	return parser(input);
}

function spacing(input) {
	var parser = peg.zeroOrMore(whitespace);
	return parser(input);
}

function whitespace(input) {
	var currentChar = input.text.charAt(input.index);
	if(currentChar === " " || currentChar === "\t") {
		return {
			matched: true,
			text: currentChar,
			consumed: 1,
			result: null
		};
	}
	return { matched: false, consumed: 0 };
}

function eol(input) {
	var parser = peg.firstOf(peg.match("\r\n"), peg.match("\n"), peg.end);
	return parser(input);
}


	_.extend(exports, {
		parsers: {
			eol: eol,
			whitespace: whitespace,
			spacing: spacing,
			lowercase: lowercase,
			initialCap: initialCap,
			h3 : h3,
			h2 : h2,
			h1 : h1,
			italicsEnd: italicsEnd,
			italicsDelim: italicsDelim,
			boldEnd: boldEnd,
			boldDelim: boldDelim,
			capWord: capWord,
			text: text,
			link: link,
			inlineContent: inlineContent,
			italics: italics,
			bold: bold,
			paragraph: paragraph,
			headerIntro: headerIntro,
			header: header,
			block: block,
			htmlText: htmlText
		}
	});

})();
