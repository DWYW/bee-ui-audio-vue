import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'example',
      component: () => import(/* webpackChunkName: "audio" */ './pages/example.vue')
    }
  ]
})
