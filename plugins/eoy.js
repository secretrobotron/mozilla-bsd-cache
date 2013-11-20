/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var https = require('https');

function getCampaignData (slug, callback) {
  var httpsOptions = {
    hostname: 'sendto.mozilla.org',
    port: 443,
    path: '/page/contribute_c/' + slug + '/xml',
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
  });

  req.end();
}

function getSourceData (sources, callback) {
  var complete = 0;

  sources = sources.map(function (key) { return {name: key} });

  sources.forEach(function (source) {
    var slug = 'eoy-' + source.name;

    getCampaignData(slug, function (data) {
      source.data = data;
      if (++complete === sources.length) {
        callback(sources);
      }
    });
  });
}

function getPeriodData (callback) {
  var complete = 0;

  var periods =[
    {month: 10, startDate: 1, endDate: 15},
    {month: 10, startDate: 16, endDate: 31},
    {month: 11, startDate: 1, endDate: 15},
    {month: 11, startDate: 16, endDate: 30},
    {month: 12, startDate: 1, endDate: 15},
    {month: 12, startDate: 16, endDate: 31}
  ];

  periods.forEach(function (period) {
    var slug = 'eoy-{month}_{startDate}-{month}_{endDate}';
    slug = slug.replace(/\{month\}/g, period.month);
    slug = slug.replace(/\{startDate\}/g, period.startDate);
    slug = slug.replace(/\{endDate\}/g, period.endDate);

    getCampaignData(slug, function (data) {
      period.data = data;
      if (++complete === periods.length) {
        callback(periods);
      }
    });
  });
}

module.exports = function (sourceList) {
  return function (callback) {
    getPeriodData(function (periodData) {
      getSourceData(sourceList, function (sourceData) {
        callback([
          {
            filename: 'eoy.json',
            data: JSON.stringify({
              period: periodData,
              source: sourceData
            }),
            contentType: 'text/json'
          }
        ]);
      });
    });
  };
};