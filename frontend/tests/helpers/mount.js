import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

export const freshPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export const memoryRouter = async (initial = '/') => {
  const Stub = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'upload', component: Stub },
      { path: '/wardrobe', name: 'wardrobe', component: Stub },
    ],
  })
  router.push(initial)
  await router.isReady()
  return router
}
