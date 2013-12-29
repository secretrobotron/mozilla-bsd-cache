/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var https = require('https');

function getYearlyData (callback) {
  var httpsOptions = {
    hostname: 'sendto.mozilla.org',
    port: 443,
    path: '/page/contribute_c/yearly/xml',
    method: 'GET'
  };

  var accumulatedData = '';

  var req = https.request(httpsOptions, function (res) {
    res.on('data', function (data) {
      accumulatedData += data.toString();
    });
    res.on('end', function (data) {
      var parsed;
      var matchedData = accumulatedData.match(/<details>([^<]*)<\/details>/);
      try {
        parsed = JSON.parse(matchedData[1]);
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
    getYearlyData(function (data) {
      callback([
        {
          filename: 'yearly.json',
          data: JSON.stringify(data),
          contentType: 'text/json'
        }
      ]);
    });
  };
};