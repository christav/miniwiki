// Function library for dealing with wikitext
// to html formatting

(function () {
	var _ = require("underscore");
	var peg = require("../peg");

function dump(obj, indent) {
	var spacing, tab, result;

	if (!indent) {
		indent = 0;
	}
	spacing = new Array(indent * 4).join(' ');
	tab = "    ";

	if(obj === undefined) {
		return "undefined";
	}
	if(obj === null) {
		return "null";
	}

	if(typeof obj === 'boolean') {
		return obj.toString();
	}
	if(typeof obj === 'string') {
		return '"' + obj + '"';
	}
	if(typeof obj === 'number') {
		return obj.toString();
	}
	if(typeof obj === 'function') {
		return "Function";
	}

	if(obj instanceof Array) {
		result = "[\n";
		obj.forEach(function (item) {
			result += spacing + tab + dump(item, indent + 1) + ",\n"
		});
		result += spacing + "]";
		return result;
	}
	if(typeof obj === 'object')
	{
		result = "{\n";
		Object.keys(obj).forEach(function (propName) {
			result += spacing + tab + propName + ": ";
			result += dump(obj[propName], indent + 1);
			result += ",\n";
		})
		result += spacing + "}";
		return result;
	}
	return 'object ' + obj + ' is not handled correctly';
}

//
// PEG Parser for the wiki markup
//
// HTMLText <- Block* END
// Block <- Header / Paragraph
// Header <- HeaderIntro InlineContent* EOL
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
// EOL <- \r\n / \n / END

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

	_.extend(exports, {
		dump: dump,
		parsers: {
			eol: eol,
			whitespace: whitespace,
			spacing: spacing,
			lowercase: lowercase,
			initialCap: initialCap,
			// h3 : h3,
			// h2 : h2,
			// h1 : h1,
			text: text,
			link: link,
			inlineContent: inlineContent,
			italics: italics,
			bold: bold,
			paragraph: paragraph,
			// headerIntro: headerIntro,
			// header: header,
			// block: block,
			// htmlText: htmlText
		}
	});

})();
