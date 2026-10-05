import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'
import { freshPinia, memoryRouter } from './helpers/mount'

describe('App', () => {
  it('renders the routed view', async () => {
    const router = await memoryRouter('/wardrobe')
    router.getRoutes().find((r) => r.name === 'wardrobe').components.default = { template: '<p>wardrobe page</p>' }

    const wrapper = mount(App, { global: { plugins: [router] } })
    await router.replace('/wardrobe')

    expect(wrapper.text()).toContain('wardrobe page')
  })
})

describe('main', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
    vi.resetModules()
    freshPinia()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mounts the app with the upload view on /', async () => {
    window.history.pushState({}, '', '/')

    await import('../src/main.js')
    await vi.waitFor(() => expect(document.querySelector('#app').innerHTML).toContain('Upload Video'), { timeout: 30_000 })
  }, 35_000)
})
