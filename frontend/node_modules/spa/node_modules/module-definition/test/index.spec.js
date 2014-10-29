var getModuleType = require('../');
var path = require("path");
var fs = require("fs");

function asyncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function(done) {
        getModuleType(path.resolve(__dirname, filename), function (type) {
            expect(type).toBe(result);
            done();
        });
    });
}

function syncTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function() {
        var type = getModuleType.sync(path.resolve(__dirname, filename));
        expect(type).toBe(result);
    });
}

function sourceTest(filename, result) {
    it("should return `" + result + "` as type of " + filename, function() {
        var source = fs.readFileSync(path.resolve(__dirname, filename));
        var type = getModuleType.fromSource(source);
        expect(type).toBe(result);
    });
}

describe("Async tests", function() {
    beforeEach(function(done) {
        this.originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;
        done();
    });

    asyncTest("./a.js", "commonjs");
    asyncTest("./b.js", "commonjs");
    asyncTest("./c.js", "amd");
    asyncTest("./d.js", "none");
    asyncTest("./e.js", "amd");
    asyncTest("./f.js", "amd");
    asyncTest("./g.js", "commonjs");
    asyncTest("./h.js", "none");

    it('throws if the filename is not supplied', function() {
        expect(function () { getModuleType(); } ).toThrow();
    });

    it('throws if a callback is not supplied', function() {
        expect(function () { getModuleType('./a.js'); } ).toThrow();
    });

    afterEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.originalTimeout;
    });
});

describe("Sync tests", function() {
    syncTest("./a.js", "commonjs");
    syncTest("./b.js", "commonjs");
    syncTest("./c.js", "amd");
    syncTest("./d.js", "none");
    syncTest("./e.js", "amd");
    syncTest("./f.js", "amd");
    syncTest("./g.js", "commonjs");
    syncTest("./h.js", "none");

    it('throws if the filename is not supplied', function() {
        expect(function () { getModuleType.sync(); } ).toThrow();
    });
});

describe("From source tests", function() {
    sourceTest("./a.js", "commonjs");
    sourceTest("./b.js", "commonjs");
    sourceTest("./c.js", "amd");
    sourceTest("./d.js", "none");
    sourceTest("./e.js", "amd");
    sourceTest("./f.js", "amd");
    sourceTest("./g.js", "commonjs");
    sourceTest("./h.js", "none");

    it('throws if source code is not supplied', function() {
        expect(function () { getModuleType.fromSource(); } ).toThrow();
    });
});
