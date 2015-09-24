'use strict';
const genericValidator = require('./generic-validator');

module.exports = [
  {
    name: 'GSM.default',
    encoding: 'GSM',
    shiftTableUdh: [],
    validator: genericValidator({})
  }, {
    name: 'GSM.turkish.single',
    encoding: 'GSM',
    shiftTableUdh: shiftTable(0x01),
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