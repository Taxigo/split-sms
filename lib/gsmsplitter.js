'use strict';
function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || {
    buffer: false,
    summary: false
  };
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
      totalBytes: 0
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

  if (fitsOneMessage()) {
    return {
      parts: [{
        content: options.summary ? undefined :
            encodeGsm(messages[0].content + messages[1].content, options.encoding),
        length: totalLength,
        bytes: totalBytes
      }],
      encoding: options.encoding,
      totalLength: totalLength,
      totalBytes: totalBytes
    };
  } else {
    return {
      parts: messages,
      encoding: options.encoding,
      totalLength: totalLength,
      totalBytes: totalBytes
    };
  }


  function encodeGsm(str) {
    if (str === undefined) {
      return undefined;
    } else if (!options.buffer) {
      return str;
    } else {
      let gsmChars = [];
      for (let char of str.split('')) {
        let gsmChar = encoding.charMap[char];
        if (!gsmChar) {
          const extendedChar = encoding.extendedChars[char];
          if (extendedChar) {
            gsmChar = encoding.charMap[extendedChar];
            gsmChars.push(0x1b);
          }
        }
        gsmChars.push(gsmChar === undefined ? 0x20 : gsmChar);
      }
      return new Buffer(gsmChars);
    }
  }

  function fitsOneMessage() {
    messages[1] && totalBytes <= singleUdhLength();
  }
  function isLastByte(currentCharByteLength) {
    return 160 - multiUdhLength() - currentCharByteLength;
  }
  function multiUdhLength() {
    return 6 + options.encoding.shiftTableUdh.length;
  }
  function singleUdhLength() {
    return 1 +
        (options.encoding.shiftTableUdh.length === 0 ? 0 :
        options.encoding.shiftTableUdh.length + 1);
  }
};
