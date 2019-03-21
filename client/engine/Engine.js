const StorageKey = {
  DEVICE_ID: 'TDSDK_deviceId',
  AUTH: 'auth',
}

const supportedEnv = {
  dev: 'dev',
  staging: 'staging',
  production: 'production',
}

export default class Engine {
  static _profiles = {}
  static _configs = {}
  // 某些设备不能setStorage， 用_mockStorage代替
  static _mockStorage = {}

  static init = ({ configs }) => {
    Engine._configs = configs
  }

  static setEnv = (env = '') => {
    env = supportedEnv[env] || Engine._configs.env || Engine._configs.defaultEnv
    if (env !== Engine._configs.env) {
      Engine._profiles = {}
      Engine._configs.env = env
      Engine._configs = { ...Engine._configs, ...Engine._configs[env] }
      Engine._profiles.auth = Engine.getStorage(StorageKey.AUTH)
    }
  }

  static getOpenId = () => {
    const { user } = Engine._profiles.auth || {}
    return user ? user.openId : ''
  }

  static getNickName = () => {
    const { user } = Engine._profiles.auth || {}
    return user ? user.nickname : ''
  }

  static getToken = () => {
    return Engine._profiles.auth && Engine._profiles.auth.token
  }

  static getWeAppId = () => {
    return Engine._configs.weAppId || ''
  }

  static getEnv = () => {
    return Engine._configs.env
  }

  static getEndPoint = () => {
    return Engine._configs.apiEndpoint
  }

  static getConfigs = () => {
    return Engine._configs
  }

  static getVersion = () => {
    return Engine._configs.version
  }

  static getApiVersion = () => {
    return Engine._configs.apiVersion
  }

  static login = (auth) => {
    if (!auth) {
      return
    }

    Engine._profiles.auth = auth
    Engine.setStorage(StorageKey.AUTH, auth, { expiresIn: auth.expiresIn })
  }

  static relogin = () => {
    if (Engine._profiles.auth) {
      Engine.clearToken()
    }
  }

  static updateAuth = (auth) => {
    if (Engine._profiles.auth) {
      Engine._profiles.auth.user = auth.user
      Engine._profiles.auth.token = auth.token
    } else {
      Engine._profiles.auth = auth
    }

    Engine.setStorage(StorageKey.AUTH, auth)
  }

  static shouldUploadUserInfo = () => {
    return !Engine._profiles.auth || !Engine._profiles.auth.user.nickname
  }

  static getSessionKey = () => {
    return (Engine._profiles.auth && Engine._profiles.auth.sessionKey) || ''
  }

  static clearToken = () => {
    delete Engine._profiles.auth
    Engine.removeStorage(StorageKey.AUTH)
  }

  // expiresIn 单位秒
  static setStorage = (key, data, { scoped = true, expiresIn } = {}) => {
    let storageKey = key
    if (scoped) {
      storageKey = `${Engine.getEnv()}-${Engine._configs.storageVersion}-${key}`
    }

    Engine._mockStorage[storageKey] = data
    my.setStorageSync({ key: storageKey, data })

    if (expiresIn) {
      // 减去 1 分钟防止抵消各种消耗
      const expiresAt = new Date().valueOf() + (expiresIn - 60) * 1000
      my.setStorageSync({ key: `${storageKey}-expired-at`, data: expiresAt })
    }
  }

  static getStorage = (key, { scoped = true } = {}) => {
    let storageKey = key
    if (scoped) {
      storageKey = `${Engine.getEnv()}-${Engine._configs.storageVersion}-${key}`
    }

    const value = Engine._mockStorage[storageKey]
    if (value) {
      return value
    }

    const expiredAt = my.getStorageSync({ key: `${storageKey}-expired-at` })
    if (expiredAt && expiredAt < new Date().valueOf()) {
      return null
    }
    const { data } = my.getStorageSync({ key: storageKey })
    return data
  }

  static removeStorage = (key, { scoped = true } = {}) => {
    let storageKey = key
    if (scoped) {
      storageKey = `${Engine.getEnv()}-${Engine._configs.storageVersion}-${key}`
    }

    delete Engine._mockStorage[storageKey]
    my.removeStorageSync({ key: storageKey })
    my.removeStorageSync({ key: `${storageKey}-expired-at` })
  }

  static formatQuery = (query) => {
    return Object.keys(query)
      .filter((key) => query[key] !== undefined)
      .map((key) => `${key}=${query[key]}`)
      .join('&')
  }
}
