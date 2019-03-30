module.exports.FAN_MODE = {
  SLOW: 1,
  MID: 2,
  HIGH: 3,
  AUTO: 254,
  NO_CHANGE: 255
}

module.exports.MODE = {
  OFF: 0,
  COOL: 1,
  HEAT: 2,
  DRY: 3,
  FAN: 4,
  AUTO: 254,
  NO_CHANGE: 255
}

// Thermostat modes
module.exports.THERMOSTAT_MODES = {
  tmOff: 0x00000000,
  tmCool: 0x00000001,
  tmHeat: 0x00000002,
  tmDry: 0x00000003,
  tmFan: 0x00000004,
  tmAuto: 0x000000fe,
  tmDoNotChange: 0x000000ff,
  tmLastMode: 0x000000fd,
  tmDoNotChangeFlags: 0x000000ff,
  tmDoNotChangeSetpoint: -327.68,
}

module.exports.SOLIDMATION_THERMOSTAT_MODES = {
  tmOff: 0x00000000,
  tmCool: 0x00000001,
  tmHeat: 0x00000002,
  tmDry: 0x00000003,
  tmFan: 0x00000004,
  tmAuto: 0x000000fe,
  tmDoNotChange: 0x000000ff,
  tmLastMode: 0x000000fd,
  tmDoNotChangeFlags: 0x000000ff,
  tmDoNotChangeSetpoint: -327.68,
}

module.exports.HOMEKIT_HEATING_COOLING_STATE = {
  OFF: 0,
  HEAT: 1,
  COOL: 2,
  AUTO: 3,
}

// Endpoint value types
module.exports.etThermostat = 0x0000000C
module.exports.evtThermostatMode = 14;
module.exports.evtThermostatFanMode = 15;
module.exports.evtThermostatDesiredTempC = 20;
module.exports.evtMeasuredTemperatureC = 13;

// Endpoint parameters
module.exports.VP_ENDPOINT_THERMOSTAT_SETPOINT_MIN = "SetpointMinC";
module.exports.VP_ENDPOINT_THERMOSTAT_SETPOINT_MAX = "SetpointMaxC";

// Endpoint capabilities
module.exports.ENDPOINT_CAPABILITIES = {
  ecOnOff: 0x00000001,
  ecDim: 0x00000002,
  ecDimRate: 0x00000004,
  ecAutoOff: 0x00000008,
  ecCurtainUpDown: 0x00000010,
  ecCurtainPosition: 0x00000020,
  ecSetColor: 0x00000040,
  ecThermostatOff: 0x00000080,
  ecThermostatCool: 0x00000100,
  ecThermostatHeat: 0x00000200,
  ecThermostatDry: 0x00000400,
  ecThermostatAuto: 0x00000800,
  ecThermostatFanAuto: 0x00001000,
  ecThermostatFan1: 0x00002000,
  ecThermostatFan2: 0x00004000,
  ecThermostatFan3: 0x00008000,
  ecThermostatVSwing: 0x00010000,
  ecThermostatHSwing: 0x00020000,
  ecThermostatFan: 0x00040000,
  ecCurtainStop: 0x00100000,
  ecThermostatTurbo: 0x00200000
}