// Wiki repository backed by azure storage
//
// Uses table storage to store the page revision history,
// and blob storage for the actual page contents.
//

"use strict";

var azure = require("azure"),
    flow = require("flow"),
    _ = require("underscore");

var defaultContainerName = "wikipages";

// This represents no page found or an error in loading.
var noSuchPage = {
    exists: false,
    history: [],
    wikiText: ""
};

function AzureRepository(containerName, storageAccount, accessKey) {
    this.tableService = azure.createTableService(storageAccount, accessKey);
    this.blobService = azure.createBlobService(storageAccount, accessKey);
    this.containerName = containerName;
    this.testSupport = new TestSupport(this);
}

_.extend(AzureRepository.prototype, {

    readPage: function (pageName, callback) {
        var that = this;
        var revisions;

        flow.exec(
            function () {
                that._getHistory(pageName, this);
            },
            function (err, history) {
                if (err) { return callback(new Error(err.message)); }

                var maxRevision = history.length - 1;
                this.history = history;

                if (maxRevision === -1) {
                    return callback(null, noSuchPage);
                }

                that._loadPageRevision(pageName, maxRevision, this);
            },
            function (err, pageData) {
                if (err) {
                    return callback(new Error(err.message));
                }

                var result = {
                    exists: true,
                    history: this.history,
                    lastEditor: this.history[this.history.length - 1].editor,
                    lastEditDate: this.history[this.history.length - 1].editedOn,
                    wikiText: pageData.wikiText
                };

                callback(null, result);
            }
        );
    },

    _getHistory: function (pageName, callback) {
        var tableName = this._tableName(),
            tableService = this.tableService,
            query = azure.TableQuery
                .select()
                .from(tableName)
                .whereKeys(pageName);

        flow.exec(
            function () {
                tableService.queryEntities(query, this);
            },

            function (err, entities) {
                if(err) {
                    return callback(err);
                }
                return callback(null,
                    entities.map(function (entity) {
                        return {
                            editor: entity.editor,
                            editedOn: new Date(entity.editedOn)
                        }
                    }));
            }
        );
    },

    _loadPageRevision: function (pageName, index, callback) {
        var containerName = this._blobContainerName(),
            blobService = this.blobService,
            blobName = this._blobName(pageName, index);

        flow.exec(
            function () {
                blobService.getBlobToText(containerName, blobName, this);
            },

            function (err, text) {
                var pageData;

                if (err) {
                    return callback(err);
                }

                pageData = JSON.parse(text);

                return callback(null, pageData);
            }
        );
    },

    _tableName: function () {
        return this.containerName + "history";
    },

    _blobContainerName: function () {
        return this.containerName;
    },

    _blobName: function (pageName, index) {
        return pageName + "." + index + ".json";
    }
});

var TestSupport = function (repo) {
    this.repo = repo;
}

_.extend(TestSupport.prototype, {
    ensureRepositoryExists: function (callback) {
        var repo = this.repo;

        flow.exec(
            function () {
                repo.tableService.createTableIfNotExists(
                    repo._tableName(), this);
            },
            function (err) {
                if (err) { return callback(makeError(err)); }
                repo.blobService.createContainerIfNotExists(
                    repo._blobContainerName(), this);
            },
            function (err) {
                callback(makeError(err));
            }
        );
    },

   clearRepository: function (callback) {
        var that = this;
        flow.exec(
            function () {
                that.ensureRepositoryExists(this);
            },
            
            function (err) {
                if(err) { return callback(makeError(err)); }
                that._deleteHistory(this);
            },

            function (err) {
                that._deleteBlobs(this);
            },

            function (err) {
                callback(makeError(err));;
            }
        );
    },

    writePage: function (page, callback) {
        var that = this,
            repo = this.repo;

        flow.exec(
            function() {
                that._createHistoryEntries(page, this);
            },

            function(err) {
                if(err) { return callback(makeError(err)); }
                that._createPageBlobs(page, this);
            },
            function(err) {
                callback(makeError(err));
            }
        );
    },

    _createHistoryEntries: function (page, callback) {
        var repo = this.repo,
            tableService = this.repo.tableService,
            tableName = repo._tableName(),
            partitionKey = page.name;

        flow.exec(
            function () {
                page.revisions.forEach(function (revision, index) {
                    var entity = {
                        PartitionKey: partitionKey,
                        RowKey: index.toString(),
                        editor: revision.editor,
                        editedOn: revision.editedOn.toString()
                    };

                    tableService.insertOrReplaceEntity(
                        tableName, entity, this.MULTI());
                }, this);
                this.MULTI()();
            },

            function (argsArray) {
                try {
                    argsArray.forEach(function (args) {
                        if (args[0]) {
                            throw args[0];
                        }
                    })
                    callback();
                } catch(ex) {
                    callback(makeError(ex));
                }
            }
        );
    },

    _createPageBlobs: function (page, callback) {
        var repo = this.repo,
            blobService = this.repo.blobService,
            blobContainer = repo._blobContainerName();

        flow.exec(
            function () {
                page.revisions.forEach(function(revision, index) {
                    var blobName = repo._blobName(page.name, index),
                        revisionData = {
                            wikiText: revision.wikiText,
                        };

                    blobService.createBlockBlobFromText(
                        blobContainer,
                        blobName,
                        JSON.stringify(revisionData),
                        this.MULTI());
                }, this);
                this.MULTI()();
            },
            function (argsArray) {
                try {
                    argsArray.forEach(function (args) {
                        if (args[0]) throw args[0];
                    })
                    callback();
                } catch (ex) {
                    callback(makeError(ex));
                }
            }
        );
    },

    _deleteHistory: function (callback) {
        var repo = this.repo,
            tableService = this.repo.tableService,
            tableName = repo._tableName(),
            query = azure.TableQuery
                .select()
                .from(tableName);

        flow.exec(
            function () {
                tableService.queryEntities(query, this);
            },

            function (err, entities) {
                if (err) { return callback(makeError(err)); }
                entities.forEach(function (entity) { 
                    tableService.deleteEntity(tableName,
                        { 
                            PartitionKey: entity.PartitionKey,
                            RowKey: entity.RowKey
                        }, this.MULTI());
                }, this);
                this.MULTI()();
            },

            function (argsArray) {
                try {
                    argsArray.forEach(function (args) {
                        if (args[0]) { throw args[0]; }
                    });
                    callback();
                } catch (ex) {
                    callback(makeError(ex));
                }
            }
        );
    },

    _deleteBlobs: function (callback) {
        var repo = this.repo,
            blobService = repo.blobService,
            containerName = repo._blobContainerName();
        flow.exec(
            function () {
                blobService.listBlobs(containerName, this);
            },
            function (err, blobs) {
                if (err) { return callback(makeError(err)); }
                for(var index in blobs) {
                    blobService.deleteBlob(containerName, blobs[index].name, 
                        this.MULTI());
                }
                this.MULTI()();
            },
            function (argsArray) {
                try {
                    argsArray.forEach(function (args) {
                        if (args[0]) { throw args[0]; }
                    })
                    callback();
                } catch (ex) {
                    callback(makeError(ex));
                }
            }
        );
    },

});

function makeError(errObj) {
    if(!errObj || errObj instanceof Error) {
        return errObj;
    }
    return new Error(errObj.message);
}

module.exports = new AzureRepository(defaultContainerName);
module.exports.AzureRepository = AzureRepository;
