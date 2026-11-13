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
    vi.resetModules()
  })

  it('installs Pinia and the router before mounting the app', async () => {
    const use = vi.fn()
    const mount = vi.fn()
    const createApp = vi.fn(() => ({ use, mount }))
    const createPinia = vi.fn(() => 'pinia')
    const router = { install: vi.fn() }

    vi.doMock('vue', () => ({ createApp }))
    vi.doMock('pinia', () => ({ createPinia }))
    vi.doMock('../src/router', () => ({ default: router }))
    await import('../src/main.js')

    expect(createApp).toHaveBeenCalledOnce()
    expect(use).toHaveBeenNthCalledWith(1, 'pinia')
    expect(use).toHaveBeenNthCalledWith(2, router)
    expect(mount).toHaveBeenCalledWith('#app')
  })
})
