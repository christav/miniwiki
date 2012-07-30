(function () {
	var parser = require('./parser'),
		models = requre('./models'),
		_ = require('underscore');

	function toHtml(text, outputFunc) {
		var input = { 
			text: text + "\r\n",
			index: 0
		};

		var result = parser.htmlText(input);
		if(result.matched) {
			result.data.render(outputFunc);
		}
	}

	_.extend(exports, {
		toHtml: toHtml,
		readPage: models.readPage,
		parsers: parser
	});
})();

