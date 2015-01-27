require('colors');
var selenium = require('selenium-standalone')
var wd = require('wd');
var Q = require('q');

function makeBrowser(name) {
    var browser = wd.promiseRemote();

    browser.on('status', function(info) {
        console.log(info.cyan);
    });

    browser.on('command', function(eventType, command, response) {
        console.log(name + ' > ' + eventType.cyan, command, (response || '').grey);
    });

    browser.on('http', function(meth, path, data) {
        console.log(name + ' > ' + meth.magenta, path, (data || '').grey);
    });

    return browser;
}

var b1 = makeBrowser("A");
//var b2 = makeBrowser("B");
var server = null;

Q.nfcall(selenium.start, {})
    .then(function(s) {
        server = s;
    })
    .then(function() {
        return Q.all([
            b1.init({ browserName: 'chrome' }),
            //b2.init({ browserName: 'chrome' })
        ]);
    })
    .then(function() {
        return Q.all([
            b1.get("http://127.0.0.1:8010/build/"),
            //b2.get("http://127.0.0.1:8010/build/")
            ]);
    })
    .then(function() {
        return Q.all([
            b1.waitForElementById("app", 120*1000, 1000),
            //b2.waitForElementById("app", 120*1000, 1000)
            ]);
    })
    .then(function() {
        return b1
            .waitForElementByCssSelector(".profile-creation-anonymous")
            .then(function(element) {
                return element.click();
            })
    })
    .then(function() {
        return b1
            .waitForElementByCssSelector("form input[type=text]")
            .then(function(element) {
                return element.sendKeys("A1");
            })
    })
    .then(function() {
        return b1
            .waitForElementByCssSelector("form input[type=submit]")
            .then(function(element) {
                return element.click();
            })
    })

    .catch(function(error) {
        console.log(error);
    })
    // .fin(function() {
    //     return Q.all([
    //         b1.quit(),
    //         //b2.quit()
    //     ]).then(function() {
    //         server.kill();
    //     });
    // });
