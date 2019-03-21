import configs from './configs'
import { Engine } from './engine/index'

App({
  onLaunch() {
    Engine.init({ configs })
    Engine.setEnv()
  },
})
