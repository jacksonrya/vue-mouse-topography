import { createWebHistory, createRouter } from 'vue-router'

import FullViewport from './FullViewport.vue'
import HomePage from './HomePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [ {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  }, {
    path: '/viewport',
    name: 'Full Viewport',
    component: FullViewport,
  } ], 
})

export default router
