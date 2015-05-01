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

/***
 * Function to retrieve one optionchain given underlyingSymbol and expirationMomentJs
 * @param underlyingSymbol symbol of underlying
 * @param expirationMomentJs
 * @param callback
 */
YahooOptions.prototype.getOneOptionChainByExpiration = function(underlyingSymbol, expirationMomentJs, callback) {
    var url = 'http://finance.yahoo.com/q/op?s=' + underlyingSymbol + '&date=' + expirationMomentJs.unix();

    var self = this;
    superagent.get(url).end(function (error, response) {
        if (!error && response.status == 200) {
            self._parseOptionChain(response.text, callback);
        } else {
            console.error('failed: ' + JSON.stringify(error));
            callback(error);
        }
    });

};

/***
 * Function to parse one section (either call or put
 * @param option_type 'call' or 'put'
 * @param html section of html that has this section data
 * @returns {Array}
 */
YahooOptions.prototype.parse_section = function (option_type, html) {
    var final_list = [];

    var rows = html.split("<tr");

    for (var i = 3; i < rows.length; i++) {
        var cells = rows[i].split("<td>");
        var columnNumber = 1;
        var maxColumns = 11;
        var option = {};
        for (var n = 1; n < cells.length; n++) {
            // process cells in sequence - START
            var v;
            if (columnNumber == 1) {
                // strike
                option.strike = parseFloat(cells[n].split(">")[2].split("</a")[0]);
            } else if (columnNumber == 2) {
                // symbol
                option.symbol = cells[n].split("</a>")[0].split(">")[2];
            } else if (columnNumber == 3) {
                // last
                option.last = parseFloat(cells[n].split(">")[1].split("</div")[0]);
            } else if (columnNumber == 4) {
                // bid
                option.bid = parseFloat(cells[n].split(">")[1].split("</div")[0]);
            } else if (columnNumber == 5) {
                // ask
                option.ask = parseFloat(cells[n].split(">")[1].split("</div")[0]);
            } else if (columnNumber == 8) {
                // volume
                option.volume = parseFloat(cells[n].split(">")[1].split("</strong")[0]);
            } else if (columnNumber == 9) {
                // open_interest
                option.open_interest = parseFloat(cells[n].split(">")[1].split("</div")[0]);
            }

            option.type = option_type;

            // process cells in sequence - END
            if (columnNumber == (maxColumns - 1)) {
                columnNumber = 1;
                final_list.push(option);
            } else {
                ++columnNumber;
            }
        }
    }
    return final_list;
};

/***
 * Function to parse out entire option chain out of html source
 * @param data html source of entire page
 * @param callback
 * @private
 */
YahooOptions.prototype._parseOptionChain = function(data, callback) {

    var parts1 = data.split("<table");
    var calls = parts1[2];
    var puts = parts1[3];

    var options = this.parse_section('call', calls);
    callback(null, options.concat(this.parse_section('put', puts)));

};

module.exports = YahooOptions();

