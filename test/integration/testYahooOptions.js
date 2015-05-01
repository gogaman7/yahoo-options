// node core
var assert = require('assert');

// 3rd party
var async = require('async');

// our libs
var yo = require('../../lib/index');

describe('suite of integration tests surrounding yahooOptions', function() {
    it('should get all expirations and one option chain', function(done) {

        var underlyingSymbol = 'GOOG';

        async.waterfall([
            async.apply(yo.getExpirations.bind(yo), underlyingSymbol),
            function getOneOptionChain(expirations, callback) {
                console.log('getting option chain for underlying|expiration: ' + underlyingSymbol + '|' + expirations[3].clone().add(4, 'hour').format('YYYYMMDD'));
                yo.getOneOptionChainByExpiration(underlyingSymbol, expirations[3], callback);
            },
            function assertAndValidate(optionChain, callback) {
                assert(optionChain, 'making sure we got something back');
                callback();
            }
        ], done)

    })
})