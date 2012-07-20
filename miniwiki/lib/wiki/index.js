// Function library for dealing with wikitext
// to html formatting

(function () {
	var _ = require("underscore");
	var Peg = require("../peg");

	exports.parse = function wikiParse(wikiText) {
		return new PlainTextNode(wikiText);
	};

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
// BoldEnd <- BoldDelim / &EOL / &END
// ItalicsDelim <- "/"
// ItalicsEnd <- ItalicDelim / &EOL / &END
// H1 <- "!!!!"
// H2 <- "!!!"
// H3 <- "!!"
// InitialCap <- [A-Z]
// Lowercase <- [^A-Z]
// Spacing <- Whitespace*
// Whitespace <- "\t" | " "
//

	// Parse tree result types

	// Plain text objects
	function PlainTextNode(plainText) {
		return {
			render: function () { return plainText; }
		}
	}
})();
