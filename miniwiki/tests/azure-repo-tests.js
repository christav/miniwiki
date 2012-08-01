// Tests for azure storage wiki repository

"use strict";

var azure = require("azure"),
    wiki = require("./../lib/wiki"),
    flow = require("flow"),
    repoBehavior = require("./repo-behavior");

describe("Azure repository", function () {
    describe("when storage is empty", function () {
        before(function (done) {
            this.timeout(25000);
            var that = this;
            this.repo = wiki.azureRepository;
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

        before(function (done) {
            var that = this;
            this.repo = wiki.azureRepository;
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
