// Model types describing a wiki page

(function () {
	var _ = require("underscore"),
    fs = require("fs"),
    path = require("path");

    function FileSystemReader(rootPath) {
        this.rootPath = rootPath;
    }

    _.extend(FileSystemReader.prototype, {
        readPage: function (pageName, callback) {
            var self = this;
            this._loadHistory(pageName, function (err, historyData) {
                if (err) {
                    return callback(null, {});
                }

                self._loadCurrentRevision(pageName, historyData, function (err, pageData) {
                    if (err) { return callback(null, {htmlText: "", wikiText: "", history: []});
                    }

                    callback(null, {
                        history: historyData,
                        lastEditor: historyData[historyData.length - 1].editor,
                        lastEditDate: historyData[historyData.length - 1].editedOn,
                        htmlText: pageData.htmlText,
                        wikiText: pageData.wikiText
                    });
                });
            });
        },

        _loadHistory: function (pageName, callback) {
            var historyFile = path.join(this.rootPath, pageName + ".history.json");
            fs.readFile(historyFile, "utf8", function (err, data) {
                if (err) { return callback(err); }

                try {
                    var historyData = JSON.parse(data);
                    callback(null, historyData);
                } catch(exc) {
                    callback(exc);
                }
            });
        },

        _loadCurrentRevision: function (pageName, history, callback) {
            var pageFile = path.join(this.rootPath, pageName + "." + history.length + ".json");
            fs.readFile(pageFile, "utf8", function (err, data) {
                if (err) { return callback(err); }

                try {
                    var pageData = JSON.parse(data);
                    callback(null, pageData);
                } catch (exc) {
                    callback(exc);
                }
            });
        }
    });

    module.exports = new FileSystemReader("./pages");
})();