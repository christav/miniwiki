// Wiki repository backed by azure storage
//
// Uses table storage to store the page revision history,
// and blob storage for the actual page contents.
//

"use strict";

var azure = require("azure"),
    flow = require("flow"),
    _ = require("underscore"),
    wiki = require("./index.js");

var defaultContainerName = "wikipages";

function AzureRepository(containerName, storageAccount, accessKey) {
    this.tableService = azure.createTableService(storageAccount, accessKey);
    this.blobService = azure.createBlobService(storageAccount, accessKey);
    this.containerName = containerName;
    this.testSupport = new TestSupport(this);
}

_.extend(AzureRepository.prototype, {

    readPage: function (pageName, callback) {
        callback();
    },

    _tableName: function () {
        return this.containerName + "history";
    },
    _blobContainerName: function () {
        return this.containerName;
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
            function () {
                repo.blobService.createContainerIfNotExists(
                    repo._blobContainerName(), this);
            },
            function () {
                callback();
            }
        );
    },

   clearRepository: function (callback) {
        var that = this;
        flow.exec(
            function () {
                console.log("starting clear, ensuring repo exists");
                that.ensureRepositoryExists(this);
            },
            
            function () {
                console.log("Deleting table");
                that._deleteTable(this);
            },

            function () {
                console.log("Deleting blobs");
                that._deleteBlobs(this);
            },

            function () {
                console.log("Clear done");
                callback();
            }
        );
    },

    _deleteTable: function (callback) {
        var repo = this.repo;
        repo.tableService.deleteTable(repo._tableName(), callback);
    },

    _deleteBlobs: function (callback) {
        var repo = this.repo,
            blobService = repo.blobService,
            containerName = repo._blobContainerName();
        flow.exec(
            function () {
                console.log("Listing blobs in container");
                blobService.listBlobs(containerName, this);
            },
            function (err, blobs) {
                console.log("Blob list complete, deleting");
                for(var index in blobs) {
                    console.log("deleting blob " + blobs[index].name);
                    blobService.deleteBlob(containerName, blobs[index].name, 
                        this.MULTI());
                }
                this.MULTI()();
            },
            function () {
                callback();
            }
        );
    }
});

module.exports = new AzureRepository(defaultContainerName);
module.exports.AzureRepository = AzureRepository;
