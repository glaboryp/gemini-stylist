import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UploadView from '../../src/views/UploadView.vue'
import { useWardrobeStore } from '../../src/stores/wardrobe'
import { freshPinia, memoryRouter } from '../helpers/mount'

let store
let router

const video = () => new File(['x'], 'closet.mp4', { type: 'video/mp4' })

const mountView = async ({ prepare } = {}) => {
  const pinia = freshPinia()
  store = useWardrobeStore()
  vi.spyOn(store, 'getUserLocation').mockImplementation(() => {})
  prepare?.(store)
  router = await memoryRouter('/')
  vi.spyOn(router, 'push')
  return mount(UploadView, { global: { plugins: [pinia, router] } })
}

const selectFile = async (wrapper, file = video()) => {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('on load', () => {
  it('restores saved state and asks for the location', async () => {
    localStorage.setItem('gemini_wardrobe_inventory', JSON.stringify([{ id: '1' }]))

    const wrapper = await mountView()

    expect(store.inventory).toEqual([{ id: '1' }])
    expect(store.getUserLocation).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Continue with 1 items')
  })

  it('shows only the upload zone and demo button for an empty wardrobe', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Upload Video')
    expect(wrapper.text()).toContain('Try Judge Demo Mode')
    expect(wrapper.text()).not.toContain('Continue with')
    expect(wrapper.text()).not.toContain('Analyze Wardrobe')
  })
})

describe('demo mode', () => {
  it('loads the demo data and goes to the wardrobe', async () => {
    const wrapper = await mountView()
    const loadDemoData = vi.spyOn(store, 'loadDemoData')

    await wrapper.findAll('button').find((b) => b.text().includes('Judge Demo')).trigger('click')

    expect(loadDemoData).toHaveBeenCalledOnce()
    expect(router.push).toHaveBeenCalledWith('/wardrobe')
  })
})

describe('saved wardrobe', () => {
  const withItems = (s) => { s.inventory = [{ id: '1' }, { id: '2' }] }

  it('continues to the wardrobe', async () => {
    const wrapper = await mountView({ prepare: withItems })
    store.loadState = vi.fn()

    await wrapper.findAll('button').find((b) => b.text().includes('Continue with 2 items')).trigger('click')

    expect(router.push).toHaveBeenCalledWith('/wardrobe')
  })

  it('clears the data', async () => {
    const wrapper = await mountView({ prepare: withItems })
    const clearWardrobe = vi.spyOn(store, 'clearWardrobe')

    await wrapper.findAll('button').find((b) => b.text().includes('Reset')).trigger('click')

    expect(clearWardrobe).toHaveBeenCalledOnce()
    expect(wrapper.text()).not.toContain('Continue with')
  })
})

describe('choosing a file', () => {
  it('shows the file and an analyze button', async () => {
    const wrapper = await mountView()

    await selectFile(wrapper)

    expect(wrapper.text()).toContain('closet.mp4')
    expect(wrapper.text()).toContain('Analyze Wardrobe')
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('offers to add to an existing wardrobe', async () => {
    const wrapper = await mountView({ prepare: (s) => { s.inventory = [{ id: '1' }] } })

    await selectFile(wrapper)

    expect(wrapper.text()).toContain('Add to Wardrobe')
    expect(wrapper.text()).not.toContain('Continue with')
  })

  it('ignores an empty selection', async () => {
    const wrapper = await mountView()
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [], configurable: true })

    await input.trigger('change')

    expect(wrapper.text()).not.toContain('Analyze Wardrobe')
  })

  it('accepts a dropped file', async () => {
    const wrapper = await mountView()

    await wrapper.find('.cursor-pointer').trigger('drop', { dataTransfer: { files: [video()] } })

    expect(wrapper.text()).toContain('closet.mp4')
  })

  it('ignores a drop without files', async () => {
    const wrapper = await mountView()

    await wrapper.find('.cursor-pointer').trigger('drop', { dataTransfer: { files: [] } })

    expect(wrapper.text()).not.toContain('Analyze Wardrobe')
  })

  it('releases the previous preview when another file is picked', async () => {
    const wrapper = await mountView()
    await selectFile(wrapper)

    await selectFile(wrapper, new File(['y'], 'second.mp4', { type: 'video/mp4' }))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(wrapper.text()).toContain('second.mp4')
  })

  it('opens the file picker when the drop zone is clicked', async () => {
    const wrapper = await mountView()
    const click = vi.spyOn(wrapper.find('input[type="file"]').element, 'click').mockImplementation(() => {})

    await wrapper.find('.cursor-pointer').trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('does not bubble clicks on the input itself', async () => {
    const wrapper = await mountView()
    const click = vi.spyOn(wrapper.find('input[type="file"]').element, 'click').mockImplementation(() => {})

    await wrapper.find('input[type="file"]').trigger('click')

    expect(click).not.toHaveBeenCalled()
  })
})

describe('analyzing', () => {
  const startAnalysis = async (wrapper) => {
    await selectFile(wrapper)
    await wrapper.findAll('button').find((b) => b.text().includes('Analyze')).trigger('click')
  }

  it('sends the file, reaches 100% and navigates after a short delay', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    const analyze = vi.spyOn(store, 'analyzeVideo').mockImplementation(async () => { store.loading = true })

    await startAnalysis(wrapper)
    await flushPromises()

    expect(analyze).toHaveBeenCalledWith(expect.objectContaining({ name: 'closet.mp4' }))
    expect(wrapper.text()).toContain('Complete!')
    expect(wrapper.text()).toContain('100% COMPLETE')
    expect(router.push).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)

    expect(router.push).toHaveBeenCalledWith('/wardrobe')
  })

  it('advances the fake progress with matching status messages', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockImplementation(() => new Promise(() => {}))

    await startAnalysis(wrapper)
    store.loading = true
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Initializing...')

    const messageAfter = async (ms) => {
      vi.advanceTimersByTime(ms)
      await wrapper.vm.$nextTick()
      return wrapper.find('h3').text()
    }

    expect(await messageAfter(3000)).toBe('Detecting fabrics & textures...')
    expect(await messageAfter(5000)).toBe('Analyzing color palette...')
    expect(await messageAfter(5000)).toBe('Identifying clothing items...')
    expect(await messageAfter(5000)).toBe('Generating style embeddings...')
  })

  it('caps the fake progress at 90%', async () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockImplementation(() => new Promise(() => {}))
    await startAnalysis(wrapper)
    store.loading = true

    vi.advanceTimersByTime(60_000)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('90% COMPLETE')
  })

  it('stays on the page when the analysis reports an error', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockImplementation(async () => { store.error = 'failed' })

    await startAnalysis(wrapper)
    await flushPromises()
    vi.advanceTimersByTime(1000)

    expect(router.push).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Complete!')
  })

  it('reports an unexpected failure', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockRejectedValue(new Error('boom'))

    await startAnalysis(wrapper)
    store.loading = true
    await flushPromises()

    expect(wrapper.find('h3').text()).toBe('Error occurred.')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('shows the preview video while loading', async () => {
    const wrapper = await mountView()
    await selectFile(wrapper)
    store.loading = true
    await wrapper.vm.$nextTick()

    expect(wrapper.find('video').attributes('src')).toBe('blob:preview')
  })

  it('restarts the timer when analysis is started twice', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockImplementation(() => new Promise(() => {}))
    await selectFile(wrapper)
    const button = () => wrapper.findAll('button').find((b) => b.text().includes('Analyze'))

    await button().trigger('click')
    await button().trigger('click')

    expect(vi.getTimerCount()).toBe(1)
  })
})

describe('unmounting', () => {
  it('releases the preview and stops the timer', async () => {
    vi.useFakeTimers()
    const wrapper = await mountView()
    vi.spyOn(store, 'analyzeVideo').mockImplementation(() => new Promise(() => {}))
    await selectFile(wrapper)
    await wrapper.findAll('button').find((b) => b.text().includes('Analyze')).trigger('click')

    wrapper.unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('is safe when nothing was started', async () => {
    const wrapper = await mountView()

    expect(() => wrapper.unmount()).not.toThrow()
  })
})

describe('analyze without a file', () => {
  it('does nothing', async () => {
    const wrapper = await mountView()
    const analyze = vi.spyOn(store, 'analyzeVideo')

    await wrapper.vm.$.setupState.analyzeVideo()

    expect(analyze).not.toHaveBeenCalled()
  })
})
