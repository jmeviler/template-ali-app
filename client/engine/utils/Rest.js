/* eslint-disable no-console */

import Engine from '../Engine'
import Extensions from './Extensions'
import Ali from './Ali'

const Method = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
}

const lastRequestTaskMarkedAbort = {}

export default class Rest {
  static get = (url, params) => Rest.request(Method.GET, url, params)
  static post = (url, params) => Rest.request(Method.POST, url, params)
  static put = (url, params) => Rest.request(Method.PUT, url, params)
  static delete = (url, params) => Rest.request(Method.DELETE, url, params)

  static formatParams = (url, method, data) => {
    if (method !== Method.GET) {
      return url
    }

    const arrayParams = []
    for (const key in data) {
      if (Extensions.isArray(data[key]) && data[key].length) {
        arrayParams.push(`${key}=${data[key].join(',')}`)
        delete data[key]
      }
    }

    if (arrayParams.length) {
      return `${url}?${arrayParams.join('&')}`
    }

    return url
  }

  static request = (method, url, data = {}) => {
    const { ignoreLoading = false, showToast, requestName = '' } = data
    delete data.requestName
    delete data.ignoreLoading
    delete data.showToast
    let formatedUrl = Rest.formatParams(url, method, data)
    if (!ignoreLoading) {
      Ali.showLoading({
        mask: true,
        title: '加载中...',
      })
    }

    return new Promise((resolve, reject) => {
      if (!/https/.test(formatedUrl)) {
        formatedUrl = `${Engine.getEndPoint()}${formatedUrl}`
      }

      if (requestName && lastRequestTaskMarkedAbort[requestName]) {
        lastRequestTaskMarkedAbort[requestName].abort()
      }

      const requestTask = my.request({
        url: formatedUrl,
        data,
        header: Rest.getHeader(),
        method,
        success: function (response) {
          Rest.onHandleResponse({ url, method, data }, response, resolve, reject)
        },
        fail: function (res) {
          switch (res.errMsg) {
            case 'request:fail abort':
              res.isAbort = true
              break
            case 'request:fail 请求超时。':
            case 'request:fail timeout':
            case 'request:fail 似乎已断开与互联网的连接。':
            case 'request:fail The Internet connection appears to be offline.':
              res.isTimeOut = true

              if (showToast) {
                my.showToast({
                  title: '连接超时',
                  icon: 'none',
                  duration: 2000,
                })
              }

              break
            default:
              break
          }

          reject(res)
        },
        complete: function () {
          if (!ignoreLoading) {
            Ali.hideLoading()
          }
        },
      })

      if (requestName) {
        lastRequestTaskMarkedAbort[requestName] = requestTask
      }
    })
  }

  static setCookie = (cookie) => {
    Rest._cookie = cookie
    Engine.setStorage('cookie', cookie)
  }

  static getCookie = () => {
    if (!Rest._cookie) {
      return Engine.getStorage('cookie')
    }

    return Rest._cookie
  }

  static onHandleResponse = (request, response, resolve, reject) => {
    if (response.status < 400) {
      if (response.headers['Set-Cookie']) {
        Rest.setCookie(response.headers['Set-Cookie'])
      }

      resolve(response.data)
      return
    }

    switch (response.status) {
      case 401:
        Engine.relogin()
        break
      case 500:
      case 502:
      case 503:
        my.showToast({
          title: '服务器异常',
          icon: 'none',
          duration: 2000,
        })
        break
      default:
        break
    }
    reject({ request, response })

    console.error({ request, response })
  }

  static getHeader = () => {
    const header = {}

    if (Rest.getCookie()) {
      header.cookie = Rest.getCookie()
    }

    return header
  }
}
