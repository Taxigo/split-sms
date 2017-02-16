'use strict';
const Buffer = require('buffer').Buffer;
function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || {
    buffer: false,
    summary: false
  };
  options.providerReservedCharacters = options.providerReservedCharacters || 0;
  const gsmvalidator = (options.encoding || {}).validator;

  if (message === '') {
    return {
      parts: [{
        content: options.summary ? undefined : encodeGsm('', options.encoding),
        length: 0,
        bytes: 0
      }],
      encoding: options.encoding,
      totalLength: 0,
      totalBytes: 0,
      totalInPart: 160 - singleUdhLength()
    };
  }

  var messages = [];
  var length = 0;
  var bytes = 0;
  var totalBytes = 0;
  var totalLength = 0;
  var messagePart = '';


  function bank() {
    var msg = {
      content: options.summary ? undefined : encodeGsm(messagePart, options.encoding),
      length: length,
      bytes: bytes
    };
    messages.push(msg);

    totalLength += length;
    length = 0;
    totalBytes += bytes;
    bytes = 0;
    messagePart = '';
  }
  
  function addSparePartForReservedProviderCharacters() {
    const lastByteIndex = !messages[1] ? 160 : isLastByte(1);
    if(messages[messages.length - 1].length + options.providerReservedCharacters > lastByteIndex) {
      bank();
    }
  }

  for (var i = 0, count = message.length; i < count; i++) {
    var c = message.charAt(i);

    if (!gsmvalidator.validateCharacter(c)) {
      if (isHighSurrogate(c.charCodeAt(0))) {
        i++;
      }
      c = '\u0020';
    } else if (gsmvalidator.validateExtendedCharacter(c)) {
      if (bytes === isLastByte(2)) bank();
      bytes++;
    }

    bytes++;
    length++;

    if (!options.summary) messagePart += c;

    if (bytes === isLastByte(1)) bank();
  }

  if (bytes > 0) bank();
  
  addSparePartForReservedProviderCharacters();

  if (fitsOneMessage()) {
    return {
      parts: [{
        content: options.summary ? undefined :
            options.buffer ? Buffer.concat([
              messages[0].content,
              messages[1].content
            ]) : encodeGsm(messages[0].content + messages[1].content, options.encoding),
        length: totalLength,
        bytes: totalBytes
      }],
      encoding: options.encoding,
      totalLength: totalLength,
      totalBytes: totalBytes,
      totalInPart: 160 - singleUdhLength()
    };
  } else {
    return {
      parts: messages,
      encoding: options.encoding,
      totalLength: totalLength,
      totalBytes: totalBytes,
      totalInPart: 160 - 1 - (messages.length === 1 ? singleUdhLength() : multiUdhLength())
    };
  }


  function encodeGsm(str) {
    if (str === undefined) {
      return undefined;
    } else if (!options.buffer) {
      return str;
    } else {
      var gsmChars = [];
      for (var i = 0; i < str.length; i++) {
        var gsmChar = options.encoding.charMap[str[i]];
        if (gsmChar === undefined) {
          const extendedChar = options.encoding.extendedChars[str[i]];
          if (extendedChar) {
            gsmChar = options.encoding.charMap[extendedChar];
            gsmChars.push(0x1b);
          }
        }
        gsmChars.push(gsmChar === undefined ? 0x20 : gsmChar);
      }
      return new Buffer(gsmChars);
    }
  }

  function fitsOneMessage() {
    return !!messages[1] && totalBytes <= 160 - options.providerReservedCharacters - singleUdhLength();
  }
  function isLastByte(currentCharByteLength) {
    return 160 - multiUdhLength() - currentCharByteLength;
  }
  function multiUdhLength() {
    return 6 + options.encoding.shiftTableUdh.length;
  }
  function singleUdhLength() {
    return options.encoding.shiftTableUdh.length === 0 ? 0 :
        1 + (options.encoding.shiftTableUdh.length || 0);
  }
};
