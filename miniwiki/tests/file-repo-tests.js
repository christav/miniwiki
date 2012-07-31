// Tests for the wiki page repository using the node filesystem
// Potentially slow, this hits the disk.

"use strict";

var wiki = require("./../lib/wiki"),
    should = require("should"),
    fs = require("fs"),
    path = require("path"),
    flow = require("flow"),
    repoBehavior = require("./repo-behavior");

var pagePath = "./pages";

// Utility function to clear out the disk
function clearRepository(done) {
    flow.exec(
        function getPathExistence() {
            path.exists(pagePath, this);
        },
        function branchIfPathExists(exists) {
            var that = this;
            if(exists) {
                flow.exec(
                    function readCurrentContents() {
                        fs.readdir(pagePath, this);
                    },
                    function deleteAllFiles(err, files) {
                        if(files.length === 0) {
                            this();
                        } else {
                            files.forEach(function (fileName) {
                                fs.unlink(path.join(pagePath, fileName), this.MULTI());
                            }, this);
                        }
                    },
                    function () {
                        that();
                    }
                );
            } else {
                this();
            }
        },
        function () { 
            done();
        }
    );
}

describe('file repository', function () {

    describe('when the storage is empty', function () {

        // Functions & state to initialize repro to empty

        beforeEach(function (done) {
            var that = this;
            this.repo = wiki.fileRepository;
            this.repo.testSupport.clearRepository(function (){
                done();
            });
        });


        repoBehavior.shouldBehaveLikeAnEmptyRepository();
    });

    describe("when there's data on the disk", function () {

        // Sample data
        var pages = [
            {
                name: "PageOne",
                history: [{editor: "Chris", editedOn: new Date(2005, 3, 3, 15, 25)}],
                pageData: {
                    wikiText: "This is PageOne",
                }
            },
            {
                name: "PageTwo",
                history: [{editor: "ChrisTav", editedOn: new Date(2010, 4, 16, 12, 0)}],
                pageData: {
                    wikiText: "Here is PageTwo *with markup*",
                }
            }
        ];

        function writeHistory(page, callback) {
            var historyFile = wiki.fileRepository.historyFileName(page.name);
            var historyData = JSON.stringify(page.history);
            fs.writeFile(historyFile, historyData, callback);
        }

        function writeRevision(page, callback) {
            var revisionFile = wiki.fileRepository.revisionFileName(page.name, 1);

            page.htmlText = "";
            wiki.toHtml(page.wikiText, function (text) {
                page.htmlText += text;
            });

            var revisionData = JSON.stringify(page.pageData);

            fs.writeFile(revisionFile, revisionData, callback);
        }

        function writePage(page, index, done) {
            writeHistory(page, done);
            writeRevision(page, done);
        }

        beforeEach(function (done) {
            var that = this;
            this.repo = wiki.fileRepository;
            flow.exec(
                function() {
                    that.repo.testSupport.clearRepository(this);
                },
                function writePages() {
                    pages.forEach(function (page, index) {
                        writePage(page, index, this.MULTI());
                    }, this);
                },
                function () {
                    that.repo = wiki.fileRepository;
                    done();
                }
            );
        });

        repoBehavior.shouldBehaveLikeALoadedRepository();
    });
});
