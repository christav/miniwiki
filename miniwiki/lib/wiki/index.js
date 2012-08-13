(function () {
	var parser = require('./parser'),
		fileRepo = require('./file-repo'),
		azureRepo = require('./azure-repo'),
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
		readPage: fileRepo.readPage.bind(fileRepo),
		repo: fileRepo,
		fileRepository: fileRepo,
		azureRepository: azureRepo,
		parsers: parser
	});
})();

