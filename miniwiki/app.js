
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , handlebars = require('handlebars'),
  path = require('path'),
  fs = require('fs');

var app = express.createServer();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.set('view options', {
      layout: false
  });
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function startApp() {
    app.get('/', routes.index);
    app.get('/:pageName', routes.page);

    app.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'));
    });
}

path.exists('./pages', function (exists) {
    if(!exists) {
      console.log("pages directory doesn't exist, creating");
      fs.mkdir('./pages', function (err) {
        if (err) {
          console.log('Error creating pages directory: ' + err);
        } else {
          startApp();
        }
      });
    } else {
      console.log('pages directory exists');
      startApp();
    }
  });

