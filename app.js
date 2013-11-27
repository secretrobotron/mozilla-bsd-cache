/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var s3 = require('./lib/s3');

var awsInfo = {
  key: process.env.AWS_ACCESS_KEY_ID,
  secret: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BUCKET
};

var s3Client = s3.init(awsInfo.key, awsInfo.secret, awsInfo.bucket);

var plugins = [
  require('./plugins/eoy')(process.env.EOY_SOURCES.split('|'), process.env.EOY_PERIODS.split('|')),
  require('./plugins/yearly')()
];

function loopInstance (loopFinishedCallback) {
  var finished = 0;
  plugins.forEach(function (plugin) {
    plugin(function (files) {
      files.forEach(function (file) {
        s3Client.write(file.filename, file.data, function (knoxResponse) {
          if (++finished === plugins.length) {
            loopFinishedCallback();
          }
        }, file.contentType);
      });
    });
  });
}

(function loop () {
  loopInstance(function () {
    setTimeout(loop, process.env.FETCH_TIMEOUT);
  });
})();