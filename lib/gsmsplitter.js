'use strict';
function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || {summary: false};
  const gsmvalidator = (options.encoding || {}).validator;

  if (message === '') {
    return {
      parts: [{
        content: options.summary ? undefined : '',
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
      content: options.summary ? undefined : messagePart,
      contentBuffer: encodeGsm(messagePart, options.encoding),
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
      if (bytes === 152) bank();
      bytes++;
    }

    bytes++;
    length++;

    if (!options.summary) messagePart += c;

    if (bytes === 153) bank();
  }

  if (bytes > 0) bank();

  if (messages[1] && totalBytes <= 160) {
    return {
      parts: [{
        content: options.summary ? undefined : messages[0].content + messages[1].content,
        contentBuffer: encodeGsm(messages[0].content + messages[1].content, options.encoding),
        length: totalLength,
        bytes: totalBytes
      }],
      encoding: options.encoding,
      totalLength: totalLength,
      totalBytes: totalBytes
    };
  }

  return {
    parts: messages,
    encoding: options.encoding,
    totalLength: totalLength,
    totalBytes: totalBytes
  };

  function encodeGsm(str, encoding) {
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
};
