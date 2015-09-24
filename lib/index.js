const gsmEncodings = require('./gsm-encodings');
var gsmSplitter = require('./gsmsplitter'),
    unicodeSplitter = require('./unicodesplitter');

function calculateRemaining(parts, singleBytes, multiBytes, charBytes) {
  var max = parts.length === 1 ? singleBytes : multiBytes;
  return (max - parts[parts.length - 1].bytes) / charBytes;
}

var UNICODE = module.exports.UNICODE = 'Unicode';
var GSM = module.exports.GSM = 'GSM';

module.exports.split = function (message, options) {
  const useShiftTables = options && options.useShiftTables;
  var characterset = options && options.characterset;

  options = {
    buffer: options && options.buffer,
    summary: options && options.summary
  };


  options.encoding =
      (useShiftTables ? gsmEncodings : [gsmEncodings[0]]).find(function(encoding) {
        return encoding.validator.validateMessage(message);
      });

  var isGsm = (characterset === undefined && options.encoding) || characterset === GSM;
  var splitResult, singleBytes, multiBytes, charBytes;

  if (isGsm) {
    splitResult = gsmSplitter.split(message, options);
    singleBytes = 160;
    multiBytes = 153;
    charBytes = 1;
  } else {
    splitResult = unicodeSplitter.split(message, options);
    singleBytes = 140;
    multiBytes = 134;
    charBytes = 2;
  }

  var remainingInPart = calculateRemaining(splitResult.parts, singleBytes, multiBytes, charBytes);

  return {
    characterSet: isGsm ? GSM : UNICODE,
    shiftTableUdh: (splitResult.encoding || {shiftTableUdh: []}).shiftTableUdh,
    parts: splitResult.parts,
    bytes: splitResult.totalBytes,
    length: splitResult.totalLength,
    remainingInPart: remainingInPart
  };
};
