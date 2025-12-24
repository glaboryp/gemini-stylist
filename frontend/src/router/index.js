import { createRouter, createWebHistory } from 'vue-router'
import UploadView from '../views/UploadView.vue'
import WardrobeView from '../views/WardrobeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'upload',
      component: UploadView
    },
    {
      path: '/wardrobe',
      name: 'wardrobe',
      component: WardrobeView
    }
  ]
})

export default router
