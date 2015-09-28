'use strict';
const gsmEncodings = require('./gsm-encodings');
var gsmSplitter = require('./gsmsplitter'),
    unicodeSplitter = require('./unicodesplitter');

var UNICODE = module.exports.UNICODE = 'Unicode';
var GSM = module.exports.GSM = 'GSM';

module.exports.split = function (message, options) {
  var characterset = options && options.characterset;

  options = {
    useShiftTables: options && options.useShiftTables,
    buffer: options && options.buffer,
    summary: options && options.summary
  };


  options.encoding = (options.useShiftTables ? gsmEncodings : [gsmEncodings[0]]).find(function(encoding) {
        return encoding.validator.validateMessage(message);
      });

  var isGsm = (characterset === undefined && options.encoding) || characterset === GSM;
  var splitResult, charBytes;

  if (isGsm) {
    splitResult = gsmSplitter.split(message, options);
    charBytes = 1;
  } else {
    splitResult = unicodeSplitter.split(message, options);
    charBytes = 2;
  }

  var remainingInPart = calculateRemaining(splitResult.parts, splitResult.totalInPart, charBytes);

  return {
    characterSet: isGsm ? GSM : UNICODE,
    shiftTableUdh: (splitResult.encoding || {shiftTableUdh: []}).shiftTableUdh,
    parts: splitResult.parts,
    bytes: splitResult.totalBytes,
    length: splitResult.totalLength,
    totalInPart: splitResult.totalInPart,
    remainingInPart: remainingInPart
  };
};

function calculateRemaining(parts, totalInPart, charBytes) {
  return (totalInPart - parts[parts.length - 1].bytes) / charBytes;
}