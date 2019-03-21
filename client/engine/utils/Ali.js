import Engine from '../Engine'

export default class Ali {
  static _systemInfo

  static getSystemInfo = () => {
    if (!Ali._systemInfo) {
      Ali._systemInfo = my.getSystemInfoSync()
    }

    return Ali._systemInfo
  }

  static isAndroid = () => {
    return Ali.getSystemInfo().system.indexOf('iOS') === -1
  }

  static getSetting = () => {
    return new Promise((resolve, reject) => {
      my.getSetting({
        success: function (res) {
          resolve(res)
        },
        fail: function (err) {
          reject(err)
        },
      })
    })
  }

  static showToast = (content, duration = 1500) => {
    my.showToast({ content, duration, type: 'none' })
  }

  static showLoading = (option, immediately) => {
    Ali._loadingCount++
    clearTimeout(Ali._loadingTimer)
    if (immediately) {
      Ali._handleLoading(option)
    } else {
      Ali._loadingTimer = setTimeout(() => Ali._handleLoading(option), 1000)
    }
  }

  static hideLoading = (immediately) => {
    Ali._loadingCount--
    clearTimeout(Ali._loadingTimer)
    if (immediately) {
      Ali._handleLoading()
    } else {
      Ali._loadingTimer = setTimeout(() => Ali._handleLoading(), 1000)
    }
  }

  static navigateBack = () => {
    my.navigateBack()
  }

  static reLaunch = (url) => {
    my.reLaunch({ url })
  }

  static redirectTo = (path, query = {}) => {
    const queryString = Engine.formatQuery(query)
    let url = path
    if (queryString) {
      url = `${url}?${queryString}`
    }

    my.redirectTo({ url })
  }

  static navigateTo = (path, query = {}) => {
    const queryString = Engine.formatQuery(query)
    let url = path
    if (queryString) {
      url = `${url}?${queryString}`
    }

    my.navigateTo({ url })
  }

  static navigateToMiniProgram = (obj = {}) => {
    my.navigateToMiniProgram(obj)
  }

  static request = (url, data = {}, method = 'GET') => {
    return new Promise((resolve, reject) => {
      my.request({
        url,
        data,
        method,
        success: function (res) {
          resolve(res)
        },
        fail: function (err) {
          reject(err)
        },
      })
    })
  }

  static checkUpdate = () => {
    const updateManager = my.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          my.showModal({
            title: '更新提示',
            content: '新版本已经准备好，是否重启应用？',
            success: (resp) => {
              if (resp.confirm) {
                updateManager.applyUpdate()
              }
            },
          })
        })
      }
    })
  }

  static _handleLoading = (option) => {
    if (Ali._loadingCount) {
      if (!Ali._isLoadingShow) {
        Ali._isLoadingShow = true
        my.showLoading(option)
      }
    } else if (Ali._isLoadingShow) {
      Ali._isLoadingShow = false
      my.hideLoading(option)
    }
  }
}
