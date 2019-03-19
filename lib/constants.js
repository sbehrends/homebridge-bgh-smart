
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
var ecOnOff             = 0x00000001;
var ecDim               = 0x00000002;
var ecDimRate           = 0x00000004;
var ecAutoOff           = 0x00000008;
var ecCurtainUpDown     = 0x00000010;
var ecCurtainPosition   = 0x00000020;
var ecSetColor          = 0x00000040;
var ecThermostatOff     = 0x00000080;
var ecThermostatCool    = 0x00000100;
var ecThermostatHeat    = 0x00000200;
var ecThermostatDry     = 0x00000400;
var ecThermostatAuto    = 0x00000800;
var ecThermostatFanAuto = 0x00001000;
var ecThermostatFan1    = 0x00002000;
var ecThermostatFan2    = 0x00004000;
var ecThermostatFan3    = 0x00008000;
var ecThermostatVSwing  = 0x00010000;
var ecThermostatHSwing  = 0x00020000;
var ecThermostatFan     = 0x00040000;
var ecCurtainStop       = 0x00100000;
var ecThermostatTurbo   = 0x00200000;