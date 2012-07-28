(function () {
	"use strict";

	var _ = require("underscore");
	var peg = require("../peg");

//
// PEG Parser for the wiki markup
//
// HTMLText <- Block* END
// Block <- (Header / Paragraph) (Spacing EOL)*
// Header <- HeaderIntro InlineContent+ EOL
// HeaderIntro <- (H1 / H2 / H3) Spacing
// Paragraph <- InlineContent* EOL
// InlineContent <- Bold / Italics / Link / Text
// Bold <- BoldDelim BoldContent+ BoldEnd
// BoldContent <- !BoldEnd (link / ItalicsWithoutBold / Text)
// ItalicsWithoutBold <- ItalicsDelim ItalicsWithoutBoldContent+ ItalicsEnd
// ItalicsWithoutBoldContent <- !(ItalicsEnd / BoldEnd) (Link / Text)
// Italics <- ItalicsDelim ItalicsContent+ ItalicsEnd
// ItalicsContent <- !ItalicsEnd (Link / BoldWithoutItalics / Text)
// BoldWithoutItalics <- BoldDelim BoldWithoutItalicsContent+ BoldEnd
// BoldWithoutItalicsContent <- !(ItalicsEnd / BoldEnd) (Link / Text)
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
// EOL <- \r\n / \n

function htmlText(input) {
	var parser = peg.seq(peg.zeroOrMore(block), peg.end);
	var result = parser(input);
	if(result.matched) {
		result.data = {
			_innerContent: result.data[0],
			nodeType: 'htmlText',
			render: renderFunc("div")
		};
	}
	return result;
}

function block(input) {
	var parser = peg.seq(
		peg.firstOf(header, paragraph),
		peg.zeroOrMore(peg.seq(spacing, eol)));

	var result = parser(input);
	if(result.matched) {
		result.data = result.data[0].data;
	}
	return result;
}

function header(input) {
	var parser = peg.seq(headerIntro, peg.oneOrMore(inlineContent), eol);
	var result = parser(input);
	if(result.matched) {
		result.data = {
			_innerContent: result.data[1],
			nodeType: 'header',
			render: renderFunc(result.data[0].data.headerType)
		};
	}
	return result;
}

function headerIntro(input) {
	var parser = peg.seq(peg.firstOf(h1, h2, h3), spacing);
	var result = parser(input);
	if (result.matched) {
		result.data = result.data[0].data;
	}
	return result;
}

function paragraph(input) {
	var parser = peg.seq(
		peg.zeroOrMore(inlineContent),
		eol);

	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.data[0],
			nodeType: "paragraph",
			text: result.text,
			render: renderFunc("p")
		};
		result.data = resultObj;
	}
	return result;
}

function inlineContent(input) {
	var parser = peg.firstOf(bold, italics, link, text);
	return parser(input);
}

function link(input) {
	var parser = peg.onMatch(
		peg.seq(capWord, peg.oneOrMore(capWord)),
		function (result) {
			result.data = {
				nodeType: 'link',
				render: function (outputFunc) {
					outputFunc("<a href='" + result.text + "'>");
					outputFunc(result.text);
					outputFunc("</a>");
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
		result.data = {
			nodeType: 'text',
			render: function (outputFunc) {
				outputFunc(result.text);
			}
		};
	}
	return result;
}

function bold(input) {
	var parser = peg.seq(boldDelim, peg.oneOrMore(boldContent), boldEnd);
	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.data[1],
			nodeType: 'bold',
			render: renderFunc("b")
		};
		result.text = result.data[1].text;
		result.data = resultObj;
	}
	return result;
}

function boldContent(input) {
	// BoldContent <- !BoldEnd (link / ItalicsWithoutBold / Text)
	var parser = peg.seq(
		peg.not(boldEnd),
		peg.firstOf(link, italicsWithoutBold, text));
	var result = parser(input);
	if(result.matched) {
		result.data = result.data[1].data;
	}
	return result;
}

function italicsWithoutBold(input) {
	// ItalicsWithoutBold <- ItalicsDelim ItalicsWithoutBoldContent+ (ItalicsEnd / &BoldEnd)

	var parser = peg.seq(italicsDelim, 
		peg.oneOrMore(italicsWithoutBoldContent), 
		peg.firstOf(italicsEnd, peg.and(boldEnd))
	);

	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.data[1],
			nodeType: 'italics',
			render: renderFunc("i")
		};
		result.text = result.data[1].text;
		result.data = resultObj;
	}	
	return result;
}

function italicsWithoutBoldContent(input) {
	// ItalicsWithoutBoldContent <- !(ItalicsEnd / &BoldEnd) (Link / Text)	
	var parser = peg.seq(
		peg.not(
			peg.firstOf(italicsEnd, peg.and(boldEnd))
		), 
		peg.firstOf(link, text)
	);
	var result = parser(input);
	if(result.matched) {
		result.data = result.data[1].data;
	}
	return result;
}

// Italics <- ItalicsDelim ItalicsContent+ ItalicsEnd
// BoldWithoutItalicsContent <- !BoldEnd (Link / Text)

function italics(input) {
	var parser = peg.seq(italicsDelim, peg.oneOrMore(italicsContent), italicsEnd);
	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.data[1],
			nodeType: 'italics',
			render: renderFunc("i")
		};
		result.text = result.data[1].text;
		result.data = resultObj;
	}
	return result;
}

function italicsContent(input) {
	// ItalicsContent <- !ItalicsEnd (Link / BoldWithoutItalics / Text)
	var parser = peg.seq(
		peg.not(italicsEnd),
		peg.firstOf(link, boldWithoutItalics, text));
	var result = parser(input);
	if(result.matched) {
		result.data = result.data[1].data;
	}
	return result;
}

function boldWithoutItalics(input) {
	// BoldWithoutItalics <- BoldDelim BoldWithoutItalicsContent+ BoldEnd

	var parser = peg.seq(boldDelim, 
		peg.oneOrMore(boldWithoutItalicsContent), 
		peg.firstOf(boldEnd, peg.and(italicsEnd))
	);

	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.data[1],
			nodeType: 'bold',
			render: renderFunc("b")
		};
		result.text = result.data[1].text;
		result.data = resultObj;
	}	
	return result;
}

function boldWithoutItalicsContent(input) {
	// ItalicsWithoutBoldContent <- !(ItalicsEnd / &BoldEnd) (Link / Text)	
	var parser = peg.seq(
		peg.not(
			peg.firstOf(italicsEnd, peg.and(boldEnd))
		), 
		peg.firstOf(link, text)
	);
	var result = parser(input);
	if(result.matched) {
		result.data = result.data[1].data;
	}
	return result;
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
	var result = parser(input);
	if (result.matched) {
		result.data = {
			headerType: 'h1'
		};
	}
	return result;
}

function h2(input) {
	var parser = peg.match("!!!");
	var result = parser(input);
	if (result.matched) {
		result.data = {
			headerType: 'h2'
		};
	}
	return result;
}

function h3(input) {
	var parser = peg.match("!!");
	var result = parser(input);
	if (result.matched) {
		result.data = {
			headerType: 'h3'
		};
	}
	return result;
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
	var parser = peg.firstOf(peg.match('\r\n'), peg.match('\n'));
	return parser(input);
}

function renderFunc(wrapper) {
	// Helper function to generate renderers that wrap collections of inner items
	return function (outputFunc) {
		outputFunc("<" + wrapper + ">");
		_.each(this._innerContent.data, function (item) {
			item.data.render(outputFunc);
		});
		outputFunc("</" + wrapper + ">");
	};
}

function toHtml(wikiMarkup, renderFunc) {
	// Top level entry to wiki parser. Takes string of wiki markup,
	// returns the corresponding HTML. Calls the passed in
	// renderFunc repeatedly to return the resulting HTML.

	var input = {
		text: wikiMarkup + "\n",
		index: 0
	};

	var result = htmlText(input);
	result.data.render(renderFunc);
}

	_.extend(exports, {
		eol: eol,
		whitespace: whitespace,
		spacing: spacing,
		lowercase: lowercase,
		initialCap: initialCap,
		text: text,
		link: link,
		inlineContent: inlineContent,
		italics: italics,
		bold: bold,
		paragraph: paragraph,
		header: header,
		block: block,
		htmlText: htmlText
	});
})();
