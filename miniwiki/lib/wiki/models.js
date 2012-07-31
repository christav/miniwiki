// Model types describing a wiki page

(function () {
	var _ = require("underscore"),
    fs = require("fs"),
    path = require("path");

    // This represents no page found or an error in loading.
    var noSuchPage = {
        exists: false,
        history: [],
        wikiText: "",
        htmlText: ""
    };

    function FileSystemRepository(rootPath) {
        this.rootPath = rootPath;
    }

    _.extend(FileSystemRepository.prototype, {
        readPage: function (pageName, callback) {
            var self = this;
            this._loadHistory(pageName, function (err, historyData) {
                if (err) {
                    return callback(null, noSuchPage);
                }

                self._loadCurrentRevision(pageName, historyData, function (err, pageData) {
                    if (err) { 
                        return callback(null, noSuchPage);
                    }

                    callback(null, {
                        exists: true,
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
            var historyFile = this.historyFileName(pageName);
            console.log("Reading history from " + historyFile);
            fs.readFile(historyFile, "utf8", function (err, data) {
                if (err) { 
                    console.log("Error reading history, " + err);
                    return callback(err); }

                try {
                    console.log("History loaded, parsing");
                    var historyData = JSON.parse(data);
                    callback(null, historyData);
                } catch(exc) {
                    callback(exc);
                }
            });
        },

        _loadCurrentRevision: function (pageName, history, callback) {
            var pageFile = this.revisionFileName(pageName, history.length);
            console.log("Reading current revision from " + pageFile);
            fs.readFile(pageFile, "utf8", function (err, data) {
                if (err) { 
                    console.log("Error reading current revision, " + err);
                    return callback(err); 
                }

                try {
                    console.log("Current revision loaded, parsing");
                    var pageData = JSON.parse(data);
                    callback(null, pageData);
                } catch (exc) {
                    callback(exc);
                }
            });
        },

        historyFileName: function (pageName) {
            return path.join(this.rootPath, pageName + ".history.json");
        },

        revisionFileName: function (pageName, index) {
            return path.join(this.rootPath, pageName + "." + index + ".json");
        }
    });

    module.exports = new FileSystemRepository("./pages");
})();