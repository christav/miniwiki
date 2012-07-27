
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.redirect("/HomePage");
};

exports.page = function(req, res) {
    res.render('page', {page: req.param('pageName')});
};
