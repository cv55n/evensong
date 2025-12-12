/**
 * hack para expor contagem de spec do qunit para o karma
 */

var testCount = 0;
var qunitTest = QUnit.test;

QUnit.test = window.test = function() {
    testCount += 1;

    qunitTest.apply(this, arguments);
};

QUnit.begin(function(args) {
    args.totalTests = testCount;
});