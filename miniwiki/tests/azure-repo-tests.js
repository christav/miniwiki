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
});
