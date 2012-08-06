// Shared behavior that defined what it means to be a repository

var should = require("should");

exports.shouldBehaveLikeAnEmptyRepository = function () {
     it('should return with exists flag false', function (done) {
        this.timeout(25000);
        this.repo.readPage("PageThatDoesntExist", function (err, wikiData) {
            should.not.exist(err);
            if(err) {
                done(err);
            } else {
                should.exist(wikiData.exists);
                wikiData.exists.should.be.false;
                done();
            }
        });
    });

    it('should return an empty history array', function (done) {
        this.timeout(25000);
        this.repo.readPage("SomePage", function (err, wikiData) {
            if(err) { return done(err); }
            wikiData.history.should.be.ok;
            wikiData.history.length.should.equal(0);
            done(err);
        });
    });

    it('should return blank data', function (done) {
        this.timeout(25000);
        this.repo.readPage("SomeOtherPage", function (err, wikiData) {
            if (err) { return done(err); }
            should.exist(wikiData.wikiText);
            wikiData.wikiText.should.equal("");
            done(err);
        });
    });
};

exports.shouldBehaveLikeALoadedRepository = function () {
    it('should return with exists flag true', function (done) {
        this.timeout(25000);
        this.repo.readPage("PageOne", function (err, wikiData) {
            if(err) { return done(err); }
            should.exist(wikiData.exists);
            wikiData.exists.should.be.true;
            done();
        });
    });

    it('should return history for first page', function (done) {
        this.timeout(25000);
        this.repo.readPage("PageOne", function (err, wikiData) {
            if(err) { return done(err); }
            wikiData.history.should.be.ok;
            wikiData.history.length.should.be.above(0);
            done();
        });
    });

    it('should include last editor', function (done) {
        this.timeout(25000);
        this.repo.readPage("PageOne", function (err, wikiData) {
            if(err) { return done(err); }
            wikiData.lastEditor.should.equal("Chris");
            done();
        });
    });
};
