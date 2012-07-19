// Function library for dealing with wikitext
// to html formatting

(function () {
	var _ = require("underscore");

	exports.parse = function wikiParse(wikiText) {
		return new PlainTextNode(wikiText);
	};

	// Parse tree result types

	// Plain text objects
	function PlainTextNode(plainText) {
		return {
			render: function () { return plainText; }
		}
	}
})();
