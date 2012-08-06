var wiki = require('./../lib/wiki');

/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.redirect("/HomePage");
};

exports.page = function(req, res) {
    wiki.readPage(req.param('pageName'), function (err, pageData) {
        if(!pageData.exists) {
            res.render('newpage', { title: req.param('pageName') });
        } else {
            var htmlText = "";

            wiki.toHtml(pageData.wikiText, function (text) { htmlText += text; });
            var lastEdit = pageData.history[pageData.history.length - 1];

            res.render('page', {
                title: req.param('pageName'),
                history: pageData.history,
                lastEditor: lastEdit.editor,
                lastEditDate: new Date(lastEdit.editedOn),
                htmlText: htmlText,
                wikiText: pageData.wikiText
            });
        }
    });
};
