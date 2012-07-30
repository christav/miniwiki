var wiki = require('./../lib/wiki');

/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.redirect("/HomePage");
};

exports.page = function(req, res) {
    wiki.models.readPage(req.param('pageName'), function (err, pageData) {
        var htmlText = "";

        wiki.toHtml(pageData.wikiText, function (text) { htmlText += text; });
        
        var lastEdit = pageData.history[pageData.history.length - 1];
        res.render('page', {
            history: pageData.history,
            lastEditor: lastEdit.editor,
            lastEditDate: new Date(lastEdit.editedOn),
            htmlText: htmlText,
            wikiText: pageData.wikiText
        });
    });
};
