import BeeAudio from './_src/index.vue'

const install = function (Vue) {
  if (install.installed) return false

  Vue.component(BeeAudio.name, BeeAudio)
}

export default install
