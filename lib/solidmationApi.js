const request = require('request')
const utils = require('./utils')

class Solidmation {

  constructor(email, password, options) {
    if (!email || !password) {
      throw 'Missing credentials'
      return
    }

    this.options = options || {}
    this.auth = {
      email: email,
      password: password,
      token: null,
    }

    this.baseUrl = 'https://bgh-services.solidmation.com'
    this.apiUrl = `${this.baseUrl}/1.0`
    this.cacheMs = 1000

    this.homes = []
    this.statusTimestamp = {}

    this.dataPacketSerials = {
      Home: 0,
      Groups: 0,
      Devices: 0,
      Endpoints: 0,
      EndpointValues: 0,
      Scenes: 0,
      Macros: 0,
      Alarms: 0,
    }
  }

  login() {
    return new Promise((resolve, reject) => {
      request.post({
        url: `${this.baseUrl}/control/LoginPage.aspx/DoStandardLogin`,
        json: true,
        body: {
          user: this.auth.email,
          password: this.auth.password
        }
      }, (err, response) => {
        if (err) {
          reject(err)
          return
        }

        if (response.body.d === "") {
          reject('Invalid Credentials')
          return
        }

        var token = response.body.d
        this.setToken(token)

        resolve(token)
      })
    })
  }

  setToken(token = '') {
    this.auth = {
      ...this.auth,
      token,
    }
  }

  setDataPacketSerials(serials = {}) {
    return
    this.dataPacketSerials = {
      ...this.dataPacketSerials,
      ...serials,
    }
  }

  async req(endpoint, body = {}) {

    if (!this.auth.token) {
      await this.login()
    }

    // console.log('===== DO REQUEST')
    // console.log('===== ', endpoint)
    // console.log('===== ', body)

    const reqBody = {
      ...body,
      token: { Token: this.auth.token }
    }

    return new Promise((resolve, reject) => {
      request.post({
        url: `${this.apiUrl}${endpoint}`,
        json: true,
        body: reqBody
      }, function(err, response) {
        if (err) {
          reject(err)
          return
        }

        resolve(response.body)
      })
    })
  }

  async getDataPacket(homeId) {
    // console.log('===== Request for GetDataPacket =====')
    const data = await this.req('/HomeCloudService.svc/GetDataPacket', {
      homeID: homeId,
      serials: this.dataPacketSerials,
      timeOut: 10000
    })

    this.setDataPacketSerials(data.GetDataPacketResult.NewSerials)
    this.setCache(homeId)
    return data.GetDataPacketResult
  }

  async getHomes(filter = []) {
    const enumHomes = await this.req('/HomeCloudService.svc/EnumHomes')
    const { Homes } = enumHomes.EnumHomesResult
    if (filter.length === 0) {
      this.homes = Homes
      return this.homes
    }

    this.homes = Homes.filter((home) => filter.includes(home.Description))
    return this.homes
  }

  async getDevicesForHomeId(homeId) {
    let data = await this.getDataPacket(homeId)
    // console.log('getDevicesForHomeId data', data)
    if (!data.Endpoints) {
      return []
    }
    return utils.parseDevices(data)
  }

  async getDevices() {
    const a = await Promise.all(
      this.homes.map(home => this.getDevicesForHomeId(home.HomeID))
    )
    this.devices = a.flat()
    return this.devices
  }


  async updateHomeDevices(HomeID) {
    const fetchDevices = await this.getDevicesForHomeId(HomeID)
    // console.log('fetchDevices', fetchDevices)

    this.devices = this.devices.map(oldDevice => {
      const updatedDevice = fetchDevices.find(row => row.DeviceID === oldDevice.DeviceID)
      if (updatedDevice) {
        return updatedDevice
      }

      return oldDevice
    })

    return this.devices
    
  }

  async getDeviceStatus(DeviceID) {
    // console.log('DeviceID', DeviceID)
    const device = this.devices.find(acc => acc.DeviceID === DeviceID)
    // console.log('device', device)
    if (this.hasCache(device.HomeID)) {
      return device
    }
    await this.updateHomeDevices(device.HomeID)
    
    return this.devices.find(acc => acc.DeviceID === DeviceID)
  }

  async setDeviceStatus(DeviceID, mode) {
    const device = this.devices.find(device => device.DeviceID === DeviceID)

    // console.log('===== Request for HVACSetModes =====')
    // TODO: When remote is off or no batteries Result: false
    const data = await this.req('/HomeCloudCommandService.svc/HVACSetModes', {
      ...device.endpointValues,
      ...mode,
      endpointID: device.EndpointID
    })

    return
  }
  
  hasCache(HomeID) {
    if (!(HomeID in this.statusTimestamp)) {
      return false
    }
    if (utils.timestamp() - this.statusTimestamp[HomeID] > this.cacheMs) {
      return false
    }
    return true
  }
  
  setCache(HomeID) {
    this.statusTimestamp[HomeID] = utils.timestamp()
  }

  clearCache() {
    this.statusTimestamp = {}
  }
}

module.exports = Solidmation