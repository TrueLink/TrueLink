/*global mocha:true, expect:true, describe:true, it:true */
(function () {

  if (!mocha) {
    throw new Exception("mocha not loaded");
  }

  /*
   * Mocha Events:
   *
   *   - `start`  execution started
   *   - `end`  execution complete
   *   - `suite`  (suite) test suite execution started
   *   - `suite end`  (suite) all tests (and sub-suites) have finished
   *   - `test`  (test) test execution started
   *   - `test end`  (test) test completed
   *   - `hook`  (hook) hook execution started
   *   - `hook end`  (hook) hook complete
   *   - `pass`  (test) test passed
   *   - `fail`  (test, err) test failed
   *
   */

   var originalReporter = mocha._reporter,
    blanketReporter,
    oldRun,
    oldCallback;

   blanketReporter = function (runner) {
    runner.on('start', function () {
      blanket.setupCoverage();
    });

    runner.on('end', function () {
      blanket.onTestsDone();
    });

    runner.on('suite', function () {
      blanket.onModuleStart();
    });

    runner.on('test', function () {
      blanket.onTestStart();
    });

    runner.on('test end', function (test) {
      blanket.onTestDone(test.parent.tests.length,
        test.state === 'passed');
    });

    //I dont know why these became global leaks
    runner.globals(['stats', 'failures', 'runner']);

    originalReporter(runner);
  };

  mocha.reporter(blanketReporter);
  oldRun = (window.mochaPhantomJS) ? mochaPhantomJS.run : mocha.run;

  mocha.run = function (finishCallback) {
    oldCallback = finishCallback;
    console.log("waiting for blanket...");
  };

  blanket.beforeStartTestRunner({
    callback: function () {
      if (!blanket.options("existingRequireJS")){
        oldRun(oldCallback);
      }
      mocha.run = oldRun;
      oldRun();
    }
  });
})();
