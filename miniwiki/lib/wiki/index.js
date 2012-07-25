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
// ItalicsWithoutBoldContent <- !ItalicsEnd (Link / Text)
// Italics <- ItalicsDelim ItalicsContent+ ItalicsEnd
// ItalicsContent <- !ItalicsEnd (Link / BoldWithoutItalics / Text)
// BoldWithoutItalics <- BoldDelim BoldWithoutItalicsContent+ BoldEnd
// BoldWithoutItalicsContent <- !BoldEnd (Link / Text)
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

function inlineContent(input) {
	var parser = peg.firstOf(link, text);
	return parser(input);
}

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

function bold(input) {
	var parser = peg.seq(boldDelim, peg.oneOrMore(boldContent), boldEnd);
	var result = parser(input);
	if(result.matched) {
		var resultObj = {
			_innerContent: result.result[1],
			nodeType: 'bold',
			render: function (outputFunc) {
				outputFunc("<b>");
				_.each(this._innerContent.result, function (item) {
					item.result.render(outputFunc);
				});
				outputFunc("</b>");
			 }
		};
		result.text = result.result[1].text;
		result.result = resultObj;
	}
	return result;
}

function boldContent(input) {
	// BoldContent <- !BoldEnd (link / ItalicsWithoutBold / Text)
	var parser = peg.seq(
		peg.not(boldEnd),
		peg.firstOf(link, text));
	var result = parser(input);
	if(result.matched) {
		result.result = result.result[1].result;
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
			inlineContent: inlineContent,
			// italics: italics,
			boldContent: boldContent,
			bold: bold,
			// paragraph: paragraph,
			// headerIntro: headerIntro,
			// header: header,
			// block: block,
			// htmlText: htmlText
		}
	});

})();
