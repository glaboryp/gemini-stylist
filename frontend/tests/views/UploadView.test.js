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

  it('shows only the upload zone for an empty wardrobe', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Upload Video')
    expect(wrapper.text()).not.toContain('Judge')
    expect(wrapper.text()).not.toContain('Continue with')
    expect(wrapper.text()).not.toContain('Analyze Wardrobe')
  })
})

describe('swatch rack', () => {
  const rackColors = (wrapper) => wrapper.findAll('aside span.font-mono').map((s) => s.text())

  it('shows sample colors before anything is uploaded', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('aside').text()).toContain('Sample colors')
    expect(rackColors(wrapper)).toEqual(['#1e2a44', '#6b7a4f', '#b5532f', '#7f9bb5', '#d9d4c7', '#2a2a2c'])
  })

  it('shows the wardrobe colors without repeating any', async () => {
    const wrapper = await mountView({
      prepare: (s) => {
        s.inventory = [
          { id: '1', primary_color: { hex: '#AA0000', name: 'Brick' } },
          { id: '2', primary_color: '#aa0000' },
          { id: '3', primary_color: { hex: '#00BB00', name: 'Grass' } },
        ]
      },
    })

    expect(wrapper.find('aside').text()).toContain('Your colors')
    expect(rackColors(wrapper)).toEqual(['Brick', 'Grass'])
  })

  it('caps the rack at eight colors', async () => {
    const wrapper = await mountView({
      prepare: (s) => {
        s.inventory = Array.from({ length: 12 }, (_, i) => ({ id: String(i), primary_color: `#${String(i).padStart(2, '0')}0000` }))
      },
    })

    expect(rackColors(wrapper)).toHaveLength(8)
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

  const askToReset = async (wrapper) => {
    await wrapper.findAll('button').find((b) => b.text().includes('Reset')).trigger('click')
  }

  it('asks for confirmation before clearing the data', async () => {
    const wrapper = await mountView({ prepare: withItems })
    const clearWardrobe = vi.spyOn(store, 'clearWardrobe')

    await askToReset(wrapper)

    expect(clearWardrobe).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Delete your wardrobe?')
  })

  it('clears the data once confirmed', async () => {
    const wrapper = await mountView({ prepare: withItems })
    const clearWardrobe = vi.spyOn(store, 'clearWardrobe')
    await askToReset(wrapper)

    await wrapper.findAll('button').find((b) => b.text().includes('Yes, delete')).trigger('click')

    expect(clearWardrobe).toHaveBeenCalledOnce()
    expect(wrapper.text()).not.toContain('Continue with')
    expect(wrapper.text()).not.toContain('Delete your wardrobe?')
  })

  it('keeps the data when the confirmation is cancelled', async () => {
    const wrapper = await mountView({ prepare: withItems })
    const clearWardrobe = vi.spyOn(store, 'clearWardrobe')
    await askToReset(wrapper)

    await wrapper.findAll('button').find((b) => b.text().includes('Cancel')).trigger('click')

    expect(clearWardrobe).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Continue with 2 items')
    expect(wrapper.text()).toContain('Reset / Clear Data')
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

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', { dataTransfer: { files: [video()] } })

    expect(wrapper.text()).toContain('closet.mp4')
  })

  it('ignores a drop without files', async () => {
    const wrapper = await mountView()

    await wrapper.find('[data-testid="dropzone"]').trigger('drop', { dataTransfer: { files: [] } })

    expect(wrapper.text()).not.toContain('Analyze Wardrobe')
  })

  it('releases the previous preview when another file is picked', async () => {
    const wrapper = await mountView()
    await selectFile(wrapper)

    await selectFile(wrapper, new File(['y'], 'second.mp4', { type: 'video/mp4' }))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(wrapper.text()).toContain('second.mp4')
  })

  it('highlights the drop zone while a file is dragged over it', async () => {
    const wrapper = await mountView()
    const zone = wrapper.find('[data-testid="dropzone"]')

    await zone.trigger('dragover')
    expect(zone.attributes('data-dragging')).toBe('true')

    await zone.trigger('dragleave')
    expect(zone.attributes('data-dragging')).toBe('false')
  })

  it('stops highlighting once the file is dropped', async () => {
    const wrapper = await mountView()
    const zone = wrapper.find('[data-testid="dropzone"]')
    await zone.trigger('dragover')

    await zone.trigger('drop', { dataTransfer: { files: [video()] } })

    expect(zone.attributes('data-dragging')).toBe('false')
  })

  it('opens the file picker when the drop zone is clicked', async () => {
    const wrapper = await mountView()
    const click = vi.spyOn(wrapper.find('input[type="file"]').element, 'click').mockImplementation(() => {})

    await wrapper.find('[data-testid="dropzone"]').trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('does nothing when the file input is not available', async () => {
    const wrapper = await mountView()
    const click = vi.spyOn(wrapper.find('input[type="file"]').element, 'click').mockImplementation(() => {})
    wrapper.vm.$.setupState.fileInput = null

    await wrapper.find('[data-testid="dropzone"]').trigger('click')

    expect(click).not.toHaveBeenCalled()
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
    expect(wrapper.text()).toContain('100% complete')
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

    expect(await messageAfter(3000)).toBe('Reading colors...')
    expect(await messageAfter(5000)).toBe('Sorting by type and season...')
    expect(await messageAfter(5000)).toBe('Identifying clothing items...')
    expect(await messageAfter(5000)).toBe('Rating formality...')
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

    expect(wrapper.text()).toContain('90% complete')
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
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shows the error to the user', async () => {
    const wrapper = await mountView()

    store.error = 'Error analyzing video. Please try again.'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="alert"]').text()).toBe('Error analyzing video. Please try again.')
  })

  it('shows no error by default', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
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
