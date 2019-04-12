import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'audio',
      component: () => import(/* webpackChunkName: "audio" */ './docs/audio.md')
    }
  ]
})
