/*
{
    "accessories": [
      {
        "accessory": "BGH-Smart",
        "name": "Accesory Name",
        "email": "email@domain.com",
        "password": "password",
        "deviceName": "Device name in Solidmation",
        "homeId": "12345",
        "deviceId": "12345"
      }
    ],
}

*/


var Service, Characteristic;
var request = require("request");
const lib = require('./lib/bgh');

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-bgh-smart", "BGH-Smart", BghSmart);
};


function BghSmart(log, config) {
  this.log = log;

  this.name = config.name;
  this.log(this.name);

  this.device = new lib.Device()
  this.characteristicManufacturer = this.device.getDeviceManufacturer()
  this.characteristicModel = this.device.getDeviceModel()
  this.characteristicSerialNumber = this.device.getSerialNumber()
  this.device.setHomeId(config.homeId)
  this.device.setDeviceId(config.deviceId)
  var _this = this
  this.device.login(config.email, config.password)
    .then(() => {
      this.device.getStatus()
        .then(data => {
          _this.characteristicManufacturer = _this.device.getDeviceManufacturer()
          _this.characteristicModel = _this.device.getDeviceModel()
          _this.characteristicSerialNumber = _this.device.getSerialNumber()
        })
        .catch(err => {

        })
    })
    .catch((err) => {
    })

  //Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
  //Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
  this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;

  this.temperature = 19;
  this.relativeHumidity = 0.50;


  // The value property of CurrentHeatingCoolingState must be one of the following:
  //Characteristic.CurrentHeatingCoolingState.OFF = 0;
  //Characteristic.CurrentHeatingCoolingState.HEAT = 1;
  //Characteristic.CurrentHeatingCoolingState.COOL = 2;
  this.heatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;

  this.targetTemperature = 21;
  this.targetRelativeHumidity = 0.50;

  this.heatingThresholdTemperature = 25;
  this.coolingThresholdTemperature = 5;

  // The value property of TargetHeatingCoolingState must be one of the following:
  //Characteristic.TargetHeatingCoolingState.OFF = 0;
  //Characteristic.TargetHeatingCoolingState.HEAT = 1;
  //Characteristic.TargetHeatingCoolingState.COOL = 2;
  //Characteristic.TargetHeatingCoolingState.AUTO = 3;
  this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
}

BghSmart.prototype = {

  //Start
  identify: function(callback) {
    this.log("Identify requested!");

    callback(null);
  },
  // Required
  getCurrentHeatingCoolingState: function(callback) {
    this.log("getCurrentHeatingCoolingState from:", this.apiroute+"/status");

    var MODE = lib.MODE

    this.device.getStatus()
      .then(data => {
        switch(data.modeId) {
          case MODE.COOL:
            this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
            break;
          case MODE.HEAT:
            this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
            break;
          case MODE.AUTO:
            this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
            break;
          case MODE.OFF:
            this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
            break;
          default:
            this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
            break;
          }

          callback(null, this.targetHeatingCoolingState);
      })
      .catch(err => {
        callback(err);
      })

  },
  setCurrentHeatingCoolingState: function(value, callback) {
    this.log("TO BE REMOVED BECAUSE USELESS setCurrentHeatingCoolingState:", value);
    this.heatingCoolingState = value;
    var error = null;
    callback(error);
  },
  getTargetHeatingCoolingState: function(callback) {
    this.log("getTargetHeatingCoolingState:", this.targetHeatingCoolingState);
    this.getCurrentHeatingCoolingState(callback);
  },
  setTargetHeatingCoolingState: function(value, callback) {
    this.log("setTargetHeatingCoolingState from/to:", this.targetHeatingCoolingState, value);
    this.targetHeatingCoolingState = value;

    var MODE = lib.MODE

    switch(this.targetHeatingCoolingState) {
      case Characteristic.TargetHeatingCoolingState.OFF:
        this.device.turnOff();
        callback(null, this.targetHeatingCoolingState);
        break;
      case Characteristic.TargetHeatingCoolingState.HEAT://"COMFORT"
        this.device.setMode(this.targetTemperature, MODE.HEAT)
        callback(null, this.targetHeatingCoolingState);
        break;
      case Characteristic.TargetHeatingCoolingState.AUTO://"COMFORT_MINUS_ONE"
        this.device.setMode(this.targetTemperature, MODE.AUTO)
        callback(null, this.targetHeatingCoolingState);
        break;
      case Characteristic.TargetHeatingCoolingState.COOL://"COMFORT_MINUS_TWO"
        this.device.setMode(this.targetTemperature, MODE.COOL)
        callback(null, this.targetHeatingCoolingState);
        break;
      default:
        this.log("Not handled case:", json.state);
        break;
    }

  },
  getCurrentTemperature: function(callback) {
    this.log("getCurrentTemperature from:", this.apiroute+"/status");

    this.device.getStatus()
      .then(status => {
        this.temperature = status.temperature !== null ? status.temperature : status.targetTemperature;
        callback(null, this.temperature);
      })
      .catch(err => {
        callback(err);
      })
  },
  getTargetTemperature: function(callback) {
    this.log("getTargetTemperature from:", this.apiroute+"/status");

    this.device.getStatus()
      .then(status => {
        this.targetTemperature = status.targetTemperature;
        callback(null, this.targetTemperature);
      })
      .catch(err => {
        callback(err);
      })
  },

  setTargetTemperature: function(temperature, callback) {
    this.log("setTargetTemperature from:", "/targetTemperature/"+temperature);
    this.log("setTargetTemperature from:", this.targetHeatingCoolingState)

    var MODE = lib.MODE
    this.targetTemperature = temperature;
    this.device.setMode(this.targetTemperature, MODE.NO_CHANGE);
    callback(null, this.targetTemperature);
    /*
    switch( this.targetHeatingCoolingState ) {
      case Characteristic.TargetHeatingCoolingState.COOL:
        this.device.setMode(temperature, MODE.COOL)
        callback(null, temperature);
        break;
      case Characteristic.TargetHeatingCoolingState.HEAT:
        this.device.setMode(temperature, MODE.HEAT)
        callback(null, temperature);
        break;
      case Characteristic.TargetHeatingCoolingState.AUTO:
        this.device.setMode(temperature, MODE.AUTO)
        callback(null, temperature);
        break;
      default:
        this.device.setMode(temperature, MODE.NO_CHANGE)
        callback(null, temperature);
        break;
    }*/


  },
  getTemperatureDisplayUnits: function(callback) {
    this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
    var error = null;
    callback(error, this.temperatureDisplayUnits);
  },
  setTemperatureDisplayUnits: function(value, callback) {
    this.log("setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
    this.temperatureDisplayUnits = value;
    var error = null;
    callback(error);
  },

  // Optional
  getCurrentRelativeHumidity: function(callback) {
    this.log("getCurrentRelativeHumidity from:", this.apiroute+"/status");

    var error = null;
    callback(error, this.relativeHumidity);
  },
  getTargetRelativeHumidity: function(callback) {
    this.log("getTargetRelativeHumidity:", this.targetRelativeHumidity);
    var error = null;
    callback(error, this.targetRelativeHumidity);
  },
  setTargetRelativeHumidity: function(value, callback) {
    this.log("setTargetRelativeHumidity from/to :", this.targetRelativeHumidity, value);
    this.targetRelativeHumidity = value;
    var error = null;
    callback(error);
  },
/*  getCoolingThresholdTemperature: function(callback) {
    this.log("getCoolingThresholdTemperature: ", this.coolingThresholdTemperature);
    var error = null;
    callback(error, this.coolingThresholdTemperature);
  },
*/  getHeatingThresholdTemperature: function(callback) {
    this.log("getHeatingThresholdTemperature :" , this.heatingThresholdTemperature);
    var error = null;
    callback(error, this.heatingThresholdTemperature);
  },
  getName: function(callback) {
    this.log("getName :", this.name);
    var error = null;
    callback(error, this.name);
  },

  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.characteristicManufacturer)
      .setCharacteristic(Characteristic.Model, this.characteristicModel)
      .setCharacteristic(Characteristic.SerialNumber, this.characteristicSerialNumber);

    var thermostatService = new Service.Thermostat(this.name);

    // Required Characteristics
    thermostatService
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', this.getCurrentHeatingCoolingState.bind(this))
      .on('set', this.setCurrentHeatingCoolingState.bind(this));

    thermostatService
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('get', this.getTargetHeatingCoolingState.bind(this))
      .on('set', this.setTargetHeatingCoolingState.bind(this));

    thermostatService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this));

    thermostatService
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('get', this.getTargetTemperature.bind(this))
      .on('set', this.setTargetTemperature.bind(this));

    thermostatService
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', this.getTemperatureDisplayUnits.bind(this))
      .on('set', this.setTemperatureDisplayUnits.bind(this));

    // Optional Characteristics
    /*
    thermostatService
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getCurrentRelativeHumidity.bind(this));

    thermostatService
      .getCharacteristic(Characteristic.TargetRelativeHumidity)
      .on('get', this.getTargetRelativeHumidity.bind(this))
      .on('set', this.setTargetRelativeHumidity.bind(this));
    */
    /*
    thermostatService
      .getCharacteristic(Characteristic.CoolingThresholdTemperature)
      .on('get', this.getCoolingThresholdTemperature.bind(this));
    */
    /*
    thermostatService
      .getCharacteristic(Characteristic.HeatingThresholdTemperature)
      .on('get', this.getHeatingThresholdTemperature.bind(this));
    */

    thermostatService
      .getCharacteristic(Characteristic.Name)
      .on('get', this.getName.bind(this));

    return [informationService, thermostatService];
  }
};