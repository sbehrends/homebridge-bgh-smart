const nock = require('nock')
const path = require('path')
const solidmation = require('./solidmationApi')

/* test('should fail constructor', () => {
  // const api = new solidmation()
  expect(new solidmation()).toThrowError('Missing credentials')
}) */

const fakeEmail = 'test@domain.com'
const fakePass = 'some#pass'
const fakeToken = '1A21423F-1EFB-498C-B1B7-0FFF8E6AFABB'

test('should login successfully', async () => {
  const req = nock('https://bgh-services.solidmation.com')
    .post('/control/LoginPage.aspx/DoStandardLogin', { user: fakeEmail, password: fakePass})
    .reply(200, { d: fakeToken })
  
  const api = new solidmation(fakeEmail, fakePass)

  const getToken = await api.login()
  expect(getToken).toBe(fakeToken)
  expect(api.auth.token).toBe(fakeToken)
})

test('should call req and retry login', async () => {
  nock('https://bgh-services.solidmation.com')
    .post('/control/LoginPage.aspx/DoStandardLogin', { user: fakeEmail, password: fakePass})
    .reply(200, { d: fakeToken })

  nock('https://bgh-services.solidmation.com')
    .post('/1.0/fake', { Token: fakeToken})
    .reply(200, {})

  const api = new solidmation(fakeEmail, fakePass)
  const doReq = await api.req('/fake', {})

  expect(doReq).toEqual({})
  expect(nock.isDone()).toBe(true)
})

describe('getHomes', () => {
  const api = new solidmation(fakeEmail, fakePass)
  api.setToken(fakeToken)

  beforeEach(() => {
    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/EnumHomes')
      .replyWithFile(200, path.join(__dirname, '__responses__/EnumHomes.example.json'), {
        'Content-Type': 'application/json',
      })
  })

  test('should return an array with all homes', async () => {
    const homes = await api.  ()
    expect(nock.isDone()).toBe(true)
    expect(homes.length).toBe(2)
  })

  test('should return an array with filtered home', async () => {
    const homes = await api.getHomes(['DemoHome'])
    expect(nock.isDone()).toBe(true)
    expect(homes.length).toBe(1)
  })

  test('should return an array with one filtered home', async () => {
    const homes = await api.getHomes(['DemoHome', 'TestHome'])
    expect(nock.isDone()).toBe(true)
    expect(homes.length).toBe(1)
  })

  test('should match snapshot', async () => {
    const homes = await api.getHomes()
    expect(homes).toMatchSnapshot()
  })
  
})

describe('GetDataPacket', () => {
  const api = new solidmation(fakeEmail, fakePass)
  api.setToken(fakeToken)

  test('should match snapshot', async () => {
    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/GetDataPacket')
      .replyWithFile(200, path.join(__dirname, '__responses__/GetDataPacket.json'), {
        'Content-Type': 'application/json',
      })
    const data = await api.getDataPacket(123)
    expect(data).toMatchSnapshot()
  })
})

describe('getDevicesForHomeId', () => {
  const api = new solidmation(fakeEmail, fakePass)
  api.setToken(fakeToken)

  test('should match snapshot', async () => {
    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/GetDataPacket')
      .replyWithFile(200, path.join(__dirname, '__responses__/GetDataPacket.json'), {
        'Content-Type': 'application/json',
      })
    const data = await api.getDevicesForHomeId(123)
    expect(data).toMatchSnapshot()
  })
})

describe('getDevices', () => {
  const api = new solidmation(fakeEmail, fakePass)
  api.setToken(fakeToken)

  test('should match snapshot', async () => {
    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/EnumHomes')
      .replyWithFile(200, path.join(__dirname, '__responses__/EnumHomes.example.json'), {
        'Content-Type': 'application/json',
      })

    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/GetDataPacket')
      .twice()
      .replyWithFile(200, path.join(__dirname, '__responses__/GetDataPacket.json'), {
        'Content-Type': 'application/json',
      })
    
    await api.getHomes()
    const data = await api.getDevices()
    expect(data).toMatchSnapshot()
  })
})

describe('Endpoint Cache', () => {
  test('should return false', () => {
    const api = new solidmation(fakeEmail, fakePass)
    expect(api.hasCache(123)).toBe(false)
  })

  test('should return true', () => {
    const api = new solidmation(fakeEmail, fakePass)
    api.setCache(123)
    expect(api.hasCache(123)).toBe(true)
  })

  test('should return false', (done) => {
    const api = new solidmation(fakeEmail, fakePass)
    api.cacheMs = 50
    api.setCache(123)
    setTimeout(() => {
      expect(api.hasCache(123)).toBe(false)
      done()
    }, 100)
  })
})

describe('getDevicesForHomeId', () => {
  const api = new solidmation(fakeEmail, fakePass)
  api.setToken(fakeToken)

  test('should match snapshot', async () => {
    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/EnumHomes')
      .replyWithFile(200, path.join(__dirname, '__responses__/EnumHomes.example.json'), {
        'Content-Type': 'application/json',
      })

    nock('https://bgh-services.solidmation.com')
      .post('/1.0/HomeCloudService.svc/GetDataPacket')
      .replyWithFile(200, path.join(__dirname, '__responses__/GetDataPacket.json'), {
        'Content-Type': 'application/json',
      })
    
    const data = await api.getDevicesForHomeId(123)
    expect(data).toMatchSnapshot()
  })
})
