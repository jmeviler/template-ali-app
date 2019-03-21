import Engine from '../Engine'

const originalPage = Page // 保存原来的Page

const page = function (config) {
  const { onReady } = config
  config.onReady = function (options) {
    if (onReady) {
      onReady.call(this, options)
    }

    if (config.onShareAppMessage) {
      my.showShareMenu({ withShareTicket: true })
    }
  }

  if (config.onLoad) {
    const { onLoad } = config
    config.onLoad = function (options) {
      if (Page.checkAuthPromise) {
        Page.checkAuthPromise.then(() => {
          onLoad.call(this, options)
        })
      } else {
        onLoad.call(this, options)
      }
    }
  }

  if (config.onShareAppMessage) {
    const { onShareAppMessage } = config
    config.onShareAppMessage = function (options) {
      const {
        path,
        title,
        query = {},
        imageUrl,
      } = onShareAppMessage.call(this, options)

      query.inviterOpenId = Engine.getOpenId()
      query.inviterName = Engine.getNickName()
      query.env = Engine.getEnv()

      const queryString = Engine.formatQuery(query)
      return { title, imageUrl, path: `${path}?${queryString}` }
    }
  }

  return originalPage(config)
}

page.checkAuthPromise = null

export default page

