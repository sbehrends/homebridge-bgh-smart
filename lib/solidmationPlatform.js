const {
  FAN_MODE,
  MODE,
  ENDPOINT_CAPABILITIES,
} = require('./constants')
const utils = require('./utils')
const solidmation = require('./solidmationApi')

let hap;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

module.exports = (homebridge) => {
  hap = homebridge.hap;
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("BGH-Smart", SolidmationPlatform);
}

class SolidmationPlatform {
  constructor(log, config, api) {
    this.api = api
    this.log = (toLog) => {
      log('SolidmationPlatform:', toLog)
    }
    
    this.config = config;
    this.accessories = [];

    if (!config.email || !config.password) {
      this.log("Missing email and/or password in Homebridge configuration")
      return
    }

    this.log('Initializing Solidmation connection')
    this.solidmation = new solidmation(config.email, config.password)
    

    this.Accessory = Accessory

    // Service and Characteristic are from hap-nodejs
    this.Service = hap.Service;
    this.Characteristic = hap.Characteristic;
    this.UUIDGen = hap.uuid;
  
    this.api.on('didFinishLaunching', () => {
      this.log('didFinishLaunching')
      this.solidmation.login()
        .then(() => this.log('Logged in'))
        .then(() => this.solidmation.getHomes())
        .then(homes => {
          return this.solidmation.getDevices()
        })
        .then(devices => {
          // this.removeAccessory()
          // return
          devices.map(device => {
            const {
              Description,
              Address,
              HomeID,
              DeviceID,
              DeviceModelDesc,
              FirmwareVersion,
              IsOnline,
              EndpointType,
              Capabilities,
            } = device
            
            if(this.accessories.find(accesory => accesory.context.HomeID == HomeID && accesory.context.DeviceID == DeviceID)) {
              this.log(`${Description} is already registered`)
              return
            }

            this.addAccessory({
              Description,
              Address,
              HomeID,
              DeviceID,
              DeviceModelDesc,
              FirmwareVersion,
              IsOnline,
              EndpointType,
              Capabilities,
            })
          })
        })
    })
  }

  configureThermostat(accessory) {
    this.log('configureThermostat', accessory)

    if (!accessory.getService(Service.Thermostat)) {
      return
    }

    const service = accessory.getService(Service.Thermostat)

    

    try {
      service.addOptionalCharacteristic(this.Characteristic.SwingMode)
      service.addOptionalCharacteristic(this.Characteristic.RotationSpeed)
    } catch (err) {
      console.log(err)
    }
    
    service.getCharacteristic(this.Characteristic.SwingMode)
    .on('get', async (callback) => {
      console.log('Get SwingMode')
      // const device = await this.solidmation.getDeviceStatus(accessory.context.DeviceID)
      // let fanMode = device.endpointValues.fanMode
      // if (fanMode == 254) { fanMode = 0 }
      // if (device.endpointValues.mode == 0) { fanMode = 0 }
      callback(null, this.Characteristic.SwingMode.SWING_DISABLED)
    })
    .on('set', async (value, callback) => {
      // let setValue = value
      // Send value 254 for auto
      // Send value 255 for no change
      console.log('Set SwingMode ', value)
      // if (value === 0) { setValue = 254}
      // this.solidmation.setDeviceStatus(accessory.context.DeviceID, { fanMode: setValue })
      callback();
    })

    service.getCharacteristic(this.Characteristic.RotationSpeed)
      .setProps({
        minValue: 0,
        maxValue: 3,
        minStep: 1
      })
      .on('get', async (callback) => {
        console.log('Get Speed ')
        const device = await this.solidmation.getDeviceStatus(accessory.context.DeviceID)
        let fanMode = device.endpointValues.fanMode
        if (fanMode == 254) { fanMode = 0 }
        if (device.endpointValues.mode == 0) { fanMode = 0 }
        callback(null, fanMode)
      })
      .on('set', async (value, callback) => {
        let setValue = value
        // Send value 254 for auto
        // Send value 255 for no change
        console.log('Set Speed ', value)
        if (value === 0) { setValue = 254}
        this.solidmation.setDeviceStatus(accessory.context.DeviceID, { fanMode: setValue })
        callback();
      })


    service.getCharacteristic(this.Characteristic.TemperatureDisplayUnits)
      .on('get', (callback) => {
        this.log(`GET ${accessory.context.Description} - TemperatureDisplayUnits`)
        callback(null, this.Characteristic.TemperatureDisplayUnits.CELSIUS)
      })
      // .on('set', (value, callback) => {
      //   this.log(`GET ${accessory.context.Description} - TemperatureDisplayUnits`)
      //   callback(null, this.Characteristic.TemperatureDisplayUnits.CELSIUS)
      // })

    
    // TODO: Export to transform function
    console.log('accc', accessory.context.Capabilities)
    const endpointCapabilities = [this.Characteristic.TargetHeatingCoolingState.OFF]
    if (accessory.context.Capabilities & ENDPOINT_CAPABILITIES.ecThermostatCool) {
      endpointCapabilities.push(this.Characteristic.TargetHeatingCoolingState.COOL)
    }
    if (accessory.context.Capabilities & ENDPOINT_CAPABILITIES.ecThermostatHeat) {
      endpointCapabilities.push(this.Characteristic.TargetHeatingCoolingState.HEAT)
    }
    if (
      accessory.context.Capabilities & ENDPOINT_CAPABILITIES.ecThermostatCool &&
      accessory.context.Capabilities & ENDPOINT_CAPABILITIES.ecThermostatHeat) {
        endpointCapabilities.push(this.Characteristic.TargetHeatingCoolingState.AUTO)
      }
    
    service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState)
      .setProps({
        validValues: endpointCapabilities
      })
      .on('get', async (callback) => {
        this.log(`GET ${accessory.context.Description} - TargetHeatingCoolingState`)
        const device = await this.solidmation.getDeviceStatus(accessory.context.DeviceID)
        callback(null, utils.modeTranslate(device.endpointValues.mode, 'Solidmation'))
      })
      .on('set', (value, callback) => {
        this.log(`SET ${accessory.context.Description} - TargetHeatingCoolingState`)
        this.solidmation.setDeviceStatus(accessory.context.DeviceID, { mode: utils.modeTranslate(value, 'HomeKit') })
        // const value = utils.getKeyByValue(device.mode)
        callback(null, value);
      })

    service.getCharacteristic(this.Characteristic.TargetTemperature)
      .setProps({
        minValue: 17, // Replace with real endpoint values
        maxValue: 30,
        minStep: 1
      })
      .on('get', async (callback) => {
        this.log(`GET ${accessory.context.Description} - TargetTemperature`)
        const device = await this.solidmation.getDeviceStatus(accessory.context.DeviceID)
        callback(null, device.endpointValues.desiredTempC);
      })
      .on('set', (value, callback) => {
        this.log(`SET ${accessory.context.Description} - TargetTemperature`)
        this.solidmation.setDeviceStatus(accessory.context.DeviceID, { desiredTempC: value })
        callback(null, value);
      })

    service.getCharacteristic(this.Characteristic.CurrentTemperature)
      .on('get', async (callback) => {
        this.log(`GET ${accessory.context.Description} - CurrentTemperature`)
        const device = await this.solidmation.getDeviceStatus(accessory.context.DeviceID)
        callback(null, device.endpointValues.currentTemp)
      })
  }

  configureAccessory(accessory) {
    this.log(accessory.displayName, "Configure Accessory");
    var platform = this;

    // Set the accessory to reachable if plugin can currently process the accessory,
    // otherwise set to false and update the reachability later by invoking 
    // accessory.updateReachability()
    accessory.reachable = true;

    accessory.on('identify', function(paired, callback) {
      console.log(accessory.displayName, "Identify!!!");
    });

    if (accessory.getService(Service.Thermostat)) {
      this.configureThermostat(accessory)
    }

    this.accessories.push(accessory);
  }

  addAccessory(device) {
    this.log("Add Accessory", device);
    var platform = this;
  
    const uuid = this.UUIDGen.generate(`${device.DeviceID}-${device.Address}`);
    var newAccessory = new this.api.platformAccessory(`${device.Description}`, uuid);

    newAccessory.context.Description = device.Description
    newAccessory.context.HomeID = device.HomeID
    newAccessory.context.Address = device.Address
    newAccessory.context.DeviceID = device.DeviceID
    newAccessory.context.EndpointType = device.EndpointType
    newAccessory.context.setpontMaxMin = {
      max: utils.getEndpointParameter(device.Parameters, 'SetpointMaxC'),
      min: utils.getEndpointParameter(device.Parameters, 'SetpointMinC')
    }
    newAccessory.context.Capabilities = device.Capabilities
    
    newAccessory.on('identify', function(paired, callback) {
      console.log(newAccessory.displayName, "Identify!!!");
    });
    
    // Make sure you provided a name for service, otherwise it may not visible in some HomeKit apps

    newAccessory.addService(Service.Thermostat, device.Description)

    this.configureThermostat(newAccessory)

    newAccessory.getService(Service.AccessoryInformation)
      .setCharacteristic(this.Characteristic.Name, device.Description)
      .setCharacteristic(this.Characteristic.Manufacturer, "BGH")
      .setCharacteristic(this.Characteristic.Model, device.DeviceModelDesc)
      .setCharacteristic(this.Characteristic.SerialNumber, device.Address)
      .setCharacteristic(this.Characteristic.FirmwareRevision, device.FirmwareVersion);
  
    this.accessories.push(newAccessory);
    this.api.registerPlatformAccessories("homebridge-bgh-smart", "BGH-Smart", [newAccessory]);
  }

  updateAccessoriesReachability() {
    this.log("Update Reachability");
    for (var index in this.accessories) {
      var accessory = this.accessories[index];
      accessory.updateReachability(false);
    }
  }

  removeAccessory() {
    this.log("Remove Accessory");
    this.api.unregisterPlatformAccessories("homebridge-bgh-smart", "BGH-Smart", this.accessories);
    this.accessories = [];
  }
}
