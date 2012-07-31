// Tests for the wiki page repository using the node filesystem
//

"use strict";

var wiki = require("./../lib/wiki"),
    should = require("should"),
    fs = require("fs"),
    path = require("path");

var pagePath = "./pages";

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

        beforeEach(function (done) {
            // Initialize the page repo, assure that it's empty
            path.exists(pagePath, function (exists) {
                if(exists) {
                    fs.readdir(pagePath, function (err, files) {
                        if (err) { done(err); }
                        numFiles = files.length;
                        if(numFiles === 0) { 
                            done(); 
                        } else {
                            for(var i = 0, len = files.length; i < len; ++i) {
                                fs.unlink(path.join(pagePath, files[i]),
                                    fileDeleted(done()));
                            }
                        }
                    });
                } else {
                    fs.mkdir(pagePath, done);
                }
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
})