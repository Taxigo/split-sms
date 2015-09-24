'use strict';
const genericValidator = require('./generic-validator');
const gsmDefaultCharacterSet = require('./gsm-default-character-set');
module.exports = [
  {
    shiftTableUdh: [],
    charMap: gsmDefaultCharacterSet,
    extendedChars: {
      '^': 'Λ',
      '|': '¡',
      '€': 'e',
      '{': '(',
      '}': ')',
      '[': '<',
      ']': '>',
      '~': '=',
      '\\': '/'
    },
    validator: genericValidator({})
  }, {
    shiftTableUdh: shiftTable(0x01),
    charMap: gsmDefaultCharacterSet,
    extendedChars: {
      'Ş': 'S',
      'ç': 'c',
      'ş': 's',
      'Ğ': 'G',
      'ğ': 'g',
      'İ': 'I',
      'ı': 'i',

      '^': 'Λ',
      '|': '¡',
      '€': 'e',
      '{': '(',
      '}': ')',
      '[': '<',
      ']': '>',
      '~': '=',
      '\\': '/'
    },
    validator: genericValidator({
      extendedChars: '\f|^€{}[~]\\ŞçşĞğİı'
    })
  }
];

function shiftTable(shiftTable, isLockingShift) {
  return [
    isLockingShift ? 0x25 : 0x24,
    0x01,
    shiftTable
  ];
}