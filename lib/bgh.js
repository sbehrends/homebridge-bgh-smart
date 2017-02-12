const request = require('request')
const baseUrl = 'https://bgh-services.solidmation.com'
const apiUrl = 'https://bgh-services.solidmation.com/1.0'

const enumHomes = function() {
  return new Promise((resolve, reject) => {
    authReq('/HomeCloudService.svc/EnumHomes', {})
      .then((data) => {
        const { Homes } = data.EnumHomesResult
        resolve(Homes)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

const FAN_MODE = {
  SLOW: 1,
  MID: 2,
  HIGH: 3,
  AUTO: 254,
  NO_CHANGE: 255
}

const MODE = {
  OFF: 0,
  COOL: 1,
  HEAT: 2,
  DRY: 3,
  FAN: 4,
  AUTO: 254,
  NO_CHANGE: 255
}

class Device {
  constructor() {
    this.token = ''
    this.homeId = ''
    this.deviceId = '' // On API it's called endpointID
    this.deviceModel = 'Unknown'
    this.deviceManufacturer = 'BGH'
    this.deviceSerialNumber = 'FFFFFFFFFFFF'
    this.status = {}
    this.lastStatus = 0
  }

  setHomeId(homeId) {
    this.homeId = homeId
  }

  setDeviceId(deviceId) {
    this.deviceId = deviceId
  }

  setDeviceModel(deviceModel) {
    this.deviceModel = deviceModel
  }

  setSerialNumber(serialNumber) {
    this.deviceSerialNumber = serialNumber
  }

  getDeviceModel() {
    return this.deviceModel
  }

  getSerialNumber() {
    return this.deviceSerialNumber
  }

  getDeviceManufacturer() {
    return this.deviceManufacturer
  }

  login(email, password) {
    var _this = this
    return new Promise((resolve, reject) => {
      request.post({
        url: `${baseUrl}/control/LoginPage.aspx/DoStandardLogin`,
        json: true,
        body: {
          user: email,
          password: password
        }
      }, function(err, response) {
        if (err) {
          reject(err)
          return
        }

        if (response.body.d === "") {
          reject('Invalid Credentials')
          return
        }

        var token = response.body.d
        _this.token = token
        resolve(token)
      })
    })
  }

  authReq(endpoint, body) {

    body.token = {
      Token: this.token
    }

    return new Promise((resolve, reject) => {
      request.post({
        url: `${apiUrl}${endpoint}`,
        json: true,
        body: body
      }, function(err, response) {
        if (err) {
          reject(err);
          return;
        }

        resolve(response.body)
      });
    });
  }

  HVACSetModes(mode) {
    mode.endpointID = this.deviceId
    return new Promise((resolve, reject) => {
      this.lastStatus = 0
      this.authReq('/HomeCloudCommandService.svc/HVACSetModes', mode)
        .then((data) => {
          // TODO: When remote is off or no batteries Result: false
          resolve(data)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  GetDataPacket() {
    var _this = this
    return new Promise((resolve, reject) => {
      this.authReq('/HomeCloudService.svc/GetDataPacket', {
        homeID: _this.homeId,
        serials: {
          Home: 0,
          Groups: 0,
          Devices: 0,
          Endpoints: 0,
          EndpointValues: 0,
          Scenes: 0,
          Macros: 0,
          Alarms: 0
        },
        timeOut: 10000
      })
        .then((data) => {
          resolve(data.GetDataPacketResult)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  parseDevices(data) {
    const { Devices, EndpointValues, Endpoints } = data
    var devices = {}
    for (var i = EndpointValues.length - 1; i >= 0; i--) {
      var device = {
        deviceId: Endpoints[i].EndpointID,
        deviceName: Endpoints[i].Description,
        deviceData: Devices[i],
        rawData: EndpointValues[i].Values,
        data: this.parseRawData(EndpointValues[i].Values),
        endpointsData: Endpoints[i]
      }

      device.data.deviceModel = device.deviceData.DeviceModel
      device.data.deviceSerialNumber = device.deviceData.Address

      devices[device.deviceId] = device
    }
    return devices
  }

  parseRawData(data) {
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

  refreshStatus() {
    var _this = this
    return new Promise((resolve, reject) => {
      this.GetDataPacket()
        .then((data) => {
          var devices = _this.parseDevices(data)
          this.status = devices[_this.deviceId]
          this.lastStatus = Math.floor(Date.now() / 1000)
          resolve(devices[_this.deviceId])
        })
        .catch((err) => {
          reject(err)
        })
    });
  }

  getStatus() {
    var _this = this

    return new Promise((resolve, reject) => {

      if (this.token === '') {
        reject()
        return
      }

      var diff = Math.floor(Date.now() / 1000) - this.lastStatus;
      if (diff < 10) {
        resolve(_this.status.data)
        return
      }

      _this.refreshStatus()
        .then(status => {
          _this.deviceModel = _this.status.data.deviceModel
          _this.deviceSerialNumber = _this.status.data.deviceSerialNumber
          resolve(_this.status.data)
        })
        .catch(() => {
          reject()
        })

    })
  }

  turnOff() {
    var _this = this
    return new Promise((resolve, reject) => {
      this.lastStatus = 0
      this.HVACSetModes({
        desiredTempC: _this.status.data.targetTemperature,
        fanMode: FAN_MODE.NO_CHANGE,
        flags: 255,
        mode: MODE.OFF
      })
    })
  }

  setMode(temperature, mode) {
    return new Promise((resolve, reject) => {
      this.lastStatus = 0
      this.HVACSetModes({
        desiredTempC: temperature.toString(),
        fanMode: FAN_MODE.AUTO,
        flags: 255,
        mode: mode
      })
    })
  }

}

module.exports = {
  Device,
  MODE,
  FAN_MODE
}