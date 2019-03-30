const utils = require('./utils')

test('parseDevices', () => {
  const { GetDataPacketResult } = require('./__responses__/GetDataPacket.json')
  expect(utils.parseDevices(GetDataPacketResult)).toMatchSnapshot()
})

describe('getEndpointValue', () => {
  const testEndpoint = [{
    Value: 0,
    ValueType: 12
  }, {
    Value: '3',
    ValueType: 15
  }]

  test('should match endpoint value', () => {
    expect(utils.getEndpointValue(testEndpoint, 15)).toBe('3')
  })

  test('should match endpoint value', () => {   
    expect(utils.getEndpointValue(testEndpoint, 12)).toBe(0)
  })

  test('should be undefined', () => {   
    expect(utils.getEndpointValue(testEndpoint, 10)).toBe(undefined)
  })
  
})

test('getKeyByValue', () => {
  expect(utils.getKeyByValue({ OFF: 0, COOL: 1}, 1)).toBe('COOL')
})

test('modeTranslate', () => {
  expect(utils.modeTranslate(0, 'HomeKit')).toBe(0)
  expect(utils.modeTranslate(1, 'HomeKit')).toBe(2)
  expect(utils.modeTranslate(2, 'Solidmation')).toBe(1)
  expect(utils.modeTranslate(0x000000fe, 'Solidmation')).toBe(3)
})
