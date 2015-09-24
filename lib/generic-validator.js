'use strict';
function getCodePoints(str) {
  return str.split('').map(char => char.codePointAt(0));
}
const gsmAcceptedChars = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ\x20!"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà\f^{}\\[~]|€';
const gsmExtendedChars = '\f|^€{}[~]\\';


module.exports = function getValidator(options) {
  options = options || {};
  const extendedCharCodes =
      getCodePoints(options.extendedChars || gsmExtendedChars);
  const acceptedCharCodes =
      getCodePoints(options.acceptedChars || gsmAcceptedChars).
          concat(extendedCharCodes);

  return {
    validateCharacter: validateCharacter,
    validateExtendedCharacter: validateExtendedCharacter,
    validateMessage: validateMessage
  };

  function validateCharacter(character) {
    var code = character.charCodeAt(0);
    return existsInArray(code, acceptedCharCodes);
  }

  function validateExtendedCharacter(character) {
    var code = character.charCodeAt(0);
    return existsInArray(code, extendedCharCodes);
  }

  function validateMessage(message) {
    for (var i = 0; i < message.length; i++) {
      if (!validateCharacter(message.charAt(i)))
        return false;
    }
    return true;
  }
};

function existsInArray(code, array) {
  var len = array.length;
  var i = 0;
  while (i < len) {
    var e = array[i];
    if (code === e) return true;
    i++;
  }
  return false;
}
