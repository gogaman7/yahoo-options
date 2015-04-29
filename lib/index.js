// 3rd party libs
var superagent = require('superagent');
var moment = require('moment');
var async = require('async');

function YahooOptions() {

    // singleton
    if(!(this instanceof YahooOptions)) {
        return new YahooOptions();
    }

};

YahooOptions.prototype._parseForExpirations = function(data, callback) {
    var selector1 = '"epochs":[';
    var selector2 = ']}';

    var point1 = data.split(selector1)[1];
    var epochsString = point1.split(selector2)[0];

    var arrayOfUnitTimestamps = epochsString.split(',');

    async.concatSeries(arrayOfUnitTimestamps, function unitTimeIterator(unixTime, callback) {
        // saving in UTC
        callback(null, moment.unix(unixTime))
    }, callback);

};

/***
 * Function to retrieve all options expirations available
 * @param underlyingSymbol stock symbol of underlying security, for example AAPL
 * @param callback fn that will be called with the following signature: err, momentjs[]
 */
YahooOptions.prototype.getExpirations = function(underlyingSymbol, callback) {
    var url = 'http://finance.yahoo.com/q/op?s=' + underlyingSymbol;

    var self = this;
    superagent.get(url).end(function (error, response) {
        if (!error && response.status == 200) {
            self._parseForExpirations(response.text, callback);
        } else {
            console.error('failed: ' + JSON.stringify(error));
            callback(error);
        }
    });
};


module.exports = YahooOptions();

