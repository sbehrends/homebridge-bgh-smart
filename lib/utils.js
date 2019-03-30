const {
  FAN_MODE,
  MODE,
  etThermostat,
  evtThermostatMode,
  evtThermostatFanMode,
  evtThermostatDesiredTempC,
  evtMeasuredTemperatureC,
  VP_ENDPOINT_THERMOSTAT_SETPOINT_MIN,
  VP_ENDPOINT_THERMOSTAT_SETPOINT_MAX,
  SOLIDMATION_THERMOSTAT_MODES,
  HOMEKIT_HEATING_COOLING_STATE,
} = require('./constants')

const timestamp = module.exports.timestamp = () => Date.now()

module.exports.getKeyByValue = function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

const getEndpointValue = module.exports.getEndpointValue = (data, valueType) => {
  try {
    return data.find(row => row.ValueType === valueType).Value
  } catch (err) {
    return undefined
  }
}

const getEndpointParameter = module.exports.getEndpointParameter = (data, valueName) => {
  try {
    return data.find(row => row.Name === valueName).Value
  } catch (err) {
    return undefined
  }
}

module.exports.parseDevices = (data) => {
  const { Devices, EndpointValues, Endpoints } = data

  return Endpoints
    // Filter supported devices (Only thermostat for now)
    .filter(endpoint => endpoint.EndpointType == etThermostat)
    .map((endpoint) => {
      const device = Devices.find(device => device.DeviceID === endpoint.DeviceID)
      const endpointValues = EndpointValues.find(endpoint => endpoint.EndpointID === endpoint.EndpointID)

      return {
        ...endpoint,
        device,
        rawEndpointValues: endpointValues,
        endpointValues: parseThermostatEndpointValues(endpointValues.Values),
        endpointParameters: parseThermostatEndpointParameters(endpoint.Parameters),
      }
    })

  var devices = {}
  for (var i = EndpointValues.length - 1; i >= 0; i--) {
    var device = {
      deviceId: Endpoints[i].EndpointID,
      deviceName: Endpoints[i].Description,
      deviceData: Devices[i],
      rawData: EndpointValues[i].Values,
      data: parseRawData(EndpointValues[i].Values),
      endpointsData: Endpoints[i]
    }

    device.data.deviceModel = device.deviceData.DeviceModel
    device.data.deviceSerialNumber = device.deviceData.Address

    devices[device.deviceId] = device
  }
  return devices
}

module.exports.modeTranslate = (value, origin) => {
  /* 
    {
      'HomeKitValue': 'SolidmationValue'
    }
  */
  const dict = {}
  dict[HOMEKIT_HEATING_COOLING_STATE.OFF] = SOLIDMATION_THERMOSTAT_MODES.tmOff
  dict[HOMEKIT_HEATING_COOLING_STATE.HEAT] = SOLIDMATION_THERMOSTAT_MODES.tmHeat
  dict[HOMEKIT_HEATING_COOLING_STATE.COOL] = SOLIDMATION_THERMOSTAT_MODES.tmCool
  dict[HOMEKIT_HEATING_COOLING_STATE.AUTO] = SOLIDMATION_THERMOSTAT_MODES.tmAuto

  if (origin === 'HomeKit') {
    return parseInt(dict[value])
  }
  if (origin === 'Solidmation') {
    return parseInt(Object.keys(dict).find(key => dict[key] == value))
  }
}

const parseThermostatEndpointValues = (data) => {
  return {
    mode: getEndpointValue(data, evtThermostatMode),
    fanMode: getEndpointValue(data, evtThermostatFanMode),
    desiredTemp: getEndpointValue(data, evtThermostatDesiredTempC),
    currentTemp: getEndpointValue(data, evtMeasuredTemperatureC),
    swingMode: 0,
  }
}

const parseThermostatEndpointParameters = (data) => {
  return {
    minTemp: getEndpointParameter(data, VP_ENDPOINT_THERMOSTAT_SETPOINT_MIN),
    maxTemp: getEndpointParameter(data, VP_ENDPOINT_THERMOSTAT_SETPOINT_MAX),
  }
}


const parseRawData = module.exports.parseRawData = (data) => {
  // Temperature comes up as -51 if the sensor is disconnected. Make it null.
  let temperature = data.find(s => s.ValueType === 13) || null
  if (temperature) {
    temperature = parseFloat(temperature.Value)
    if (temperature <= -50) {
      temperature = null
    }
  }

  let targetTemperature = data.find(s => s.ValueType === 20).Value || null;
  targetTemperature = targetTemperature !== null ? parseFloat(targetTemperature) : null;
  if (targetTemperature === 255) {
    targetTemperature = 20
  }

  let fanSpeed = data.find(s => s.ValueType === 15).Value || null;
  fanSpeed = fanSpeed !== null ? parseInt(fanSpeed) : null;

  for (var k in FAN_MODE){
    if (FAN_MODE.hasOwnProperty(k)) {
      if (FAN_MODE[k] === fanSpeed) {
        var fanName = k
      }
    }
  }

  let modeId = data.find(s => s.ValueType === 14).Value || null;
  modeId = modeId !== null ? parseInt(modeId) : null;

  for (var k in MODE){
    if (MODE.hasOwnProperty(k)) {
      if (MODE[k] === modeId) {
        var modeName = k
      }
    }
  }

  return {
    temperature,
    targetTemperature,
    fanSpeed,
    fanName,
    modeId,
    modeName
  }
}