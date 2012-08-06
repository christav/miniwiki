// Repository implementation for node file system, 0.6

(function () {
	var _ = require("underscore"),
    fs = require("fs"),
    path = require("path"),
    flow = require("flow");

    // This represents no page found or an error in loading.
    var noSuchPage = {
        exists: false,
        history: [],
        wikiText: ""
    };

    function FileSystemRepository(rootPath) {
        this.rootPath = rootPath;
        this.testSupport = new TestSupport(this);
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
                        wikiText: pageData.wikiText
                    });
                });
            });
        },

        _loadHistory: function (pageName, callback) {
            var historyFile = this.historyFileName(pageName);
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
            var pageFile = this.revisionFileName(pageName, history.length);
            fs.readFile(pageFile, "utf8", function (err, data) {
                if (err) { return callback(err); }

                try {
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

    ///////////////////////////////////////////////
    //
    // Test support code to initialize, clear, and load test data into repo
    //

    function TestSupport(repo) {
        this.rootPath = repo.rootPath;
        this.repo = repo;
    }

    _.extend(TestSupport.prototype, {
        ensureRepositoryExists: function (callback) {
            var that = this;
            flow.exec(
                function () {
                    path.exists(that.rootPath, this);
                },

                function (exists) {
                    if (!exists) {
                        fs.mkdir(that.rootPath, this);
                    } else {
                        this();
                    }
                },
                callback);
        },

        clearRepository: function (callback) {
            var that = this;
            flow.exec(
                function () {
                    that.ensureRepositoryExists(this);
                },
                
                function deleteFiles(exists) {
                    var flowCtx = this;
                    flow.exec(
                        function readCurrentContents() {
                            fs.readdir(that.rootPath, flowCtx);
                        },
                        function deleteAllFiles(err, files) {
                            if(files.length === 0) {
                            flowCtx();
                        } else {
                            files.forEach(function (fileName) {
                                fs.unlink(path.join(pagePath, fileName), flowCtx.MULTI());
                            });
                        }
                    },
                    function () {
                        flowCtx();
                    });
                },
                function () { 
                    callback();
                }  
            );
        },

        writePage: function (page, callback) {
            var that = this;

            flow.exec(
                function () {
                    that._writeHistory(page, this);
                },
                function () {
                    that._writePageVersions(page, this);
                },
                function () {
                    callback();
                }
            );
        },

        _writePageVersions: function(page, callback) {
            var that = this;
            flow.exec(
                function () {
                    page.revisions.forEach(function (revision, index) {
                        var revisionFile = that.repo.revisionFileName(page.name, index + 1);

                        var revisionData = {
                            wikiText: revision.wikiText,
                        };

                        fs.writeFile(revisionFile, JSON.stringify(revisionData), this.MULTI());
                    }, this);
                },

                function () {
                    callback();
                }
            );
        },

        _writeHistory: function (page, callback)
        {
            var historyFile = this.repo.historyFileName(page.name);
            var historyData = page.revisions.map(function (item) {
                return {
                    editor: item.editor,
                    editedOn: item.editedOn
                };
            })
            fs.writeFile(historyFile, JSON.stringify(historyData), callback);            
        }
});

    module.exports = new FileSystemRepository("./pages");
})();