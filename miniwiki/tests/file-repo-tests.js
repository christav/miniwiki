// Tests for the wiki page repository using the node filesystem
// Potentially slow, this hits the disk.

"use strict";

var wiki = require("./../lib/wiki"),
    should = require("should"),
    flow = require("flow"),
    repoBehavior = require("./repo-behavior");

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

        var pages = [
            {
                name: "PageOne",
                revisions: [
                    {
                        editor: "Chris",
                        editedOn: new Date(2005, 3, 3, 15, 25),
                        wikiText: "This is PageOne"
                    }
                ]
            },
            {
                name: "PageTwo",
                revisions: [
                    {
                        editor: "ChrisTav",
                        editedOn: new Date(2010, 4, 16, 12, 0),
                        wikiText: "Here is PageTwo *with markup*"
                    }
                ]
            }
        ];


        beforeEach(function (done) {
            var that = this;
            this.repo = wiki.fileRepository;
            flow.exec(
                function() {
                    that.repo.testSupport.clearRepository(this);
                },
                function () {
                    pages.forEach(function (page) {
                        that.repo.testSupport.writePage(page, this.MULTI());
                    }, this);
                },
                function () {
                    done();
                }
            );
        });

        repoBehavior.shouldBehaveLikeALoadedRepository();
    });
});
