(function () {
	var parser = require('./parser'),
		models = require('./models'),
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
		models: models,
		parsers: parser
	});
})();

