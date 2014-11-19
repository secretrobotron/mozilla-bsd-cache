/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var https = require('https');
var Tabletop = require("tabletop");
var spreadsheetKey = process.env.SPREADSHEET_KEY || '';

module.exports = function () {
  return function (dataCallback){
    Tabletop.init(
      {
        key: spreadsheetKey,
        simpleSheet: true,
        callback: function(data,tabletop){
          dataCallback([
            {
              filename: 'yearly2014.json',
              data: JSON.stringify( tabletop.sheets("Data for F.M.O")["elements"] ),
              contentType: 'text/json'
            }
          ]);
        }
      }
    );
  }

};
