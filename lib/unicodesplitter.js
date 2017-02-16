'use strict';
const iconv = require('iconv-lite');
function isHighSurrogate(code) {
  return code >= 0xD800 && code <= 0xDBFF;
}

module.exports.split = function (message, options) {
  options = options || {
    buffer: false,
    summary: false
  };
  options.providerReservedBytes = options.providerReservedBytes || 0;

  if (message === '') {
    return {
      parts: [{
        content: options.summary ? undefined : options.buffer ?
            iconv.encode('', 'utf16-be') : '',
        length: 0,
        bytes: 0
      }],
      totalLength: 0,
      totalBytes: 0,
      totalInPart: 140
    };
  }

  var messages = [];
  var length = 0;
  var bytes = 0;
  var totalBytes = 0;
  var totalLength = 0;
  var partStart = 0;

  function bank(partEnd) {
    const content = (partEnd ?
        message.substring(partStart, partEnd + 1) :
        message.substring(partStart));
    var msg = {
      content: options.summary ? undefined : options.buffer ?
          iconv.encode(content, 'utf16-be') : content,
      length: length,
      bytes: bytes
    };
    messages.push(msg);

    partStart = partEnd + 1;

    totalLength += length;
    length = 0;
    totalBytes += bytes;
    bytes = 0;
  }
  
  function addSparePartForReservedProviderCharacters() {
    const lastCharIndex = messages[0].length > (70 - options.providerReservedBytes) || !messages[1] ? 70 : 67;
    if(messages[messages.length - 1].length + options.providerReservedBytes > lastCharIndex) {
      bank();
    }
  }

  for (var i = 0, count = message.length; i < count; i++) {

    var code = message.charCodeAt(i);
    var highSurrogate = isHighSurrogate(code);

    if (highSurrogate) {
      if (bytes === 132) bank(i - 1);
      bytes += 2;
      i++;
    }

    bytes += 2;
    length++;

    if (bytes === 134) bank(i);
  }

  if (bytes > 0) bank();
  
  addSparePartForReservedProviderCharacters();

  if (messages[1] && totalBytes + (options.providerReservedBytes*2) <= 140) {
    return {
      parts: [{
        content: options.summary ? undefined : options.buffer ?
            iconv.encode(message, 'utf16-be') : message,
        length: totalLength,
        bytes: totalBytes
      }],
      totalLength: totalLength,
      totalBytes: totalBytes,
      totalInPart: 140
    };
  }

  return {
    parts: messages,
    totalLength: totalLength,
    totalBytes: totalBytes,
    totalInPart: 140 - (messages.length === 1 ? 0 : 6)
  };
};
