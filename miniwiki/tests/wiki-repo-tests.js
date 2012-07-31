// Tests for the wiki page repository using the node filesystem
// Potentially slow, this hits the disk.

"use strict";

var wiki = require("./../lib/wiki"),
    should = require("should"),
    fs = require("fs"),
    path = require("path");

var pagePath = "./pages";

// Utility function to clear out the disk
function clearRepository(done) {
    path.exists(pagePath, function (exists) {
        if(exists) {
            fs.readdir(pagePath, function (err, files) {
                if (err) { done(err); }
                deleteFiles(files, 0, done);
            });
        } else {
            fs.mkdir(pagePath, done);
        }
    });
}

function deleteFiles(files, index, done) {
    if (index === files.length) { 
        done();
    } else {
        fs.unlink(path.join(pagePath, files[index]), function (err) {
            deleteFiles(files, index + 1, done);
        });
    }
}

describe('page repository', function () {

    describe('when the storage is empty', function () {

        // Functions & state to initialize repro to empty

        var numFiles;
        var numFilesDeleted;
        function fileDeleted(callback) {
            ++numFilesDeleted;
            if(numFilesDeleted === numFiles) {
                callback();
            }
        }

        beforeEach(clearRepository);

        it('should return an empty history array', function (done) {
            wiki.readPage("SomePage", function (err, wikiData) {
                wikiData.history.should.be.ok;
                wikiData.history.length.should.equal(0);
                done(err);
            });
        });

        it('should return blank data', function (done) {
            wiki.readPage("SomeOtherPage", function (err, wikiData) {
                should.exist(wikiData.wikiText);
                wikiData.wikiText.should.equal("");
                done(err);
            });
        });

        it('should return blank html text', function (done) {
            wiki.readPage("YetAnotherPage", function (err, wikiData) {
                should.exist(wikiData.htmlText);
                wikiData.htmlText.should.equal("");
                done(err);
            });
        });

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

        function writePages(err, index, done) {
            if (index === pages.length) {
                done();
            } else {
                var currentPage = pages[index];
                var historyFile = wiki.models.historyFileName(currentPage.name);
                var historyData = JSON.stringify(currentPage.history);
                fs.writeFile(historyFile, historyData, function (err) {
                    var revisionFile = wiki.models.revisionFileName(currentPage.name, 1);

                    currentPage.htmlText = "";
                    wiki.toHtml(currentPage.wikiText, function (text) {
                        currentPage.htmlText += text;
                    });

                    var revisionData = JSON.stringify(currentPage.pageData);

                    fs.writeFile(revisionFile, revisionData, function (err) {
                        console.log("Written data for page " + index);
                        writePages(null, index + 1, done);
                    });
                });
            }
        }

        beforeEach(function (done) {
            clearRepository(function () {
                writePages(null, 0, done);
            });
        });

        it('should return history for first page', function (done) {
            wiki.readPage("PageOne", function (err, wikiData) {
                wikiData.history.should.be.ok;
                wikiData.history.length.should.be.above(0);
                done();
            });
        });
    });


});
