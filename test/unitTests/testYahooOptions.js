// node-core
var fs = require('fs');
var assert = require('assert');

// 3rd party libs
var async = require('async');

// our libs
var yahooOptions = require('../../lib/index');

describe('suite of tests surrounding YahooOptions', function() {
    it('should return okay array of expirations', function(done) {

        var fileContents = fs.readFileSync(__dirname + '/samples/aapl.html').toString();

        yahooOptions._parseForExpirations(fileContents, function(err, arrayOfMomentJSDates) {
            assert(!err, 'making sure no errors occured');

            var expectedUnitTimes = JSON.parse('["1430438400","1431043200","1431648000","1432252800","1432857600","1433462400","1434672000","1437091200","1440115200","1444953600","1452816000","1484870400"]');

            async.concatSeries(arrayOfMomentJSDates, function momentJSToUnixTimeConverter(momentJS, callback) {
                callback(null, momentJS.format('X'));
            }, function(err, arrayOfUnixTimes) {
                assert.deepEqual(arrayOfUnixTimes, expectedUnitTimes, 'making sure we got exactly the array of unix times as expected');
                done(err);
            })
        });
    });

    it('should return okay an optionChain', function(done) {

        var fileContents = fs.readFileSync(__dirname + '/samples/aapl-143164800-20150515-optionChain.html').toString();

        yahooOptions._parseOptionChain(fileContents, function(err, optionChain) {

            var expectedOptionChain = JSON.parse(fs.readFileSync(__dirname + '/samples/aapl-20150515-optionChain.json').toString());

            assert(!err, 'making sure no errors occured');
            assert.deepEqual(optionChain, expectedOptionChain, 'making sure we exactly expected option chain');

            done();

        });
    });
});
