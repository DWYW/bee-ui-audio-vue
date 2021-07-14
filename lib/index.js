import { AUDIO_MANAGEMENT } from './audio'
import BeeAudio from './_src/index.vue'

const install = function (Vue) {
  if (install.installed) return false

  window.$AUDIO_MANAGEMENT = AUDIO_MANAGEMENT
  Vue.component(BeeAudio.name, BeeAudio)
}

export default install
