/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var https = require('https');
var url = require('url');

function getPaypalBalance(callback) {
  var httpsOptions = {
    hostname: 'api-3t.paypal.com',
    path: "/nvp",
    method: 'GET'
  };

  httpsOptions.path +=  '?USER=' + process.env.PAYPAL_USER +
                        '&PWD=' + process.env.PAYPAL_PWD +
                        '&SIGNATURE=' + process.env.PAYPAL_SIGNATURE +
                        '&METHOD=GetBalance' +
                        '&RETURNALLCURRENCIES=0' +
                        '&VERSION=119';
  var accumulatedData = '';

  var req = https.request(httpsOptions, function (res) {
    res.on('data', function (data) {
      accumulatedData += data.toString();
    });
    res.on('end', function (data) {
      var parsed;
      try {
        parsed = url.parse("?"+accumulatedData,true).query;
      }
      catch (e) {
        console.error(e);
      }
      callback(parsed);
    });
  });

  req.on('error', function (e) {
    console.error(e);
    return '';
  });

  req.end();
}


module.exports = function () {
  return function (callback) {
    getPaypalBalance(function(data){
      callback([
        {
          filename: 'eoy2014.json',
          data: {
            amount: data.L_AMT0,
            currency: data.L_CURRENCYCODE0,
            timestamp: data.TIMESTAMP
          },
          contentType: 'text/json'
        }
      ]);
    });
  };
};
