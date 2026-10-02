import { describe, expect, it } from 'vitest'
import router from '../src/router'
import UploadView from '../src/views/UploadView.vue'
import WardrobeView from '../src/views/WardrobeView.vue'

describe('router', () => {
  it('maps / to the upload view', () => {
    const route = router.resolve('/')

    expect(route.name).toBe('upload')
    expect(route.matched[0].components.default).toBe(UploadView)
  })

  it('maps /wardrobe to the wardrobe view', () => {
    const route = router.resolve('/wardrobe')

    expect(route.name).toBe('wardrobe')
    expect(route.matched[0].components.default).toBe(WardrobeView)
  })

  it('does not match unknown paths', () => {
    expect(router.resolve('/nope').matched).toHaveLength(0)
  })

  it('defines exactly two routes', () => {
    expect(router.getRoutes().map((r) => r.name).sort()).toEqual(['upload', 'wardrobe'])
  })
})
