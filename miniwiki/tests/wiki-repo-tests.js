// Tests for the wiki page repository using the node filesystem
// Potentially slow, this hits the disk.

"use strict";

var wiki = require("./../lib/wiki"),
    should = require("should"),
    fs = require("fs"),
    path = require("path"),
    utils = require('./test-utils.js');

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

        it('should return with exists flag false', function (done) {
            wiki.readPage("PageThatDoesntExist", function (err, wikiData) {
                should.exist(wikiData.exists);
                wikiData.exists.should.be.false;
                done();
            });
        });

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

        function writePages(err, index, done) {
            utils.eachAsync(pages,
                function(page, index, callback) {
                    writeHistory(page, function (err) {
                        writeRevision(page, callback);                        
                    });
                }, done);
        }

        beforeEach(function (done) {
            clearRepository(function () {
                writePages(null, 0, function () { done(); });
            });
        });

        it('should return with exists flag true', function (done) {
            wiki.readPage("PageOne", function (err, wikiData) {
                should.exist(wikiData.exists);
                wikiData.exists.should.be.true;
                done();
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
