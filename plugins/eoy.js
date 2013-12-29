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
        console.error('Couldn\'t parse data for ' + slug);
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

function getSourceData (sources, callback) {
  var complete = 0;

  sources = sources.map(function (key, index) {
    var sections = key.split(':');
    return {id: sections[0], name: sections[1]};
  });

  sources.forEach(function (source) {
    var slug = 'eoy-' + source.id;

    getCampaignData(slug, function (data) {
      source.data = data;
      if (++complete === sources.length) {
        callback(sources);
      }
    });
  });
}

function getPeriodData (periodList, callback) {
  var complete = 0;

  var periods = periodList.map(function (period) {
    var sections = period.split(',');
    return {month: sections[0], startDate: sections[1], endDate: sections[2]};
  });

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

module.exports = function (sourceList, periodList) {
  return function (callback) {
    getPeriodData(periodList, function (periodData) {
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