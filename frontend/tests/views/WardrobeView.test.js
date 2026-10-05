import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import WardrobeView from '../../src/views/WardrobeView.vue'
import WardrobeItemCard from '../../src/components/WardrobeItemCard.vue'
import ChatPanel from '../../src/components/ChatPanel.vue'
import VideoModal from '../../src/components/VideoModal.vue'
import { useWardrobeStore } from '../../src/stores/wardrobe'
import { freshPinia, memoryRouter } from '../helpers/mount'

const items = [
  { id: 'a', type: 'Top', subtype: 'Tee', primary_color: 'red', season: 'Summer', formality: 2, timestamp_seconds: 4 },
  { id: 'b', type: 'Bottom', subtype: 'Jeans', primary_color: 'blue', season: 'All', formality: 3 },
]

let store
let router
let seekAndPlay

const mountView = async ({ prepare, stored } = {}) => {
  const pinia = freshPinia()
  store = useWardrobeStore()
  vi.spyOn(store, 'getUserLocation').mockImplementation(() => {})
  prepare?.(store)
  if (stored) localStorage.setItem('gemini_wardrobe_inventory', JSON.stringify(stored))
  router = await memoryRouter('/wardrobe')
  vi.spyOn(router, 'push')
  seekAndPlay = vi.fn()
  return mount(WardrobeView, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        ChatPanel: { template: '<aside class="chat-stub" />' },
        VideoModal: { props: ['isOpen', 'videoUrl'], template: '<div class="modal-stub" />', methods: { seekAndPlay } },
      },
    },
  })
}

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  Element.prototype.scrollIntoView = vi.fn()
})

describe('inventory', () => {
  it('shows the empty state', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Your wardrobe is empty.')
    expect(wrapper.text()).toContain('0 pieces')
    expect(wrapper.findAllComponents(WardrobeItemCard)).toHaveLength(0)
  })

  it('invites the user to upload from the empty state', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('button').find((b) => b.text().includes('Upload Video')).trigger('click')

    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('uses the singular for a single piece', async () => {
    const wrapper = await mountView({ prepare: (s) => { s.inventory = [items[0]] } })

    expect(wrapper.text()).toContain('1 piece')
    expect(wrapper.text()).not.toContain('1 pieces')
  })

  it('renders a card per item', async () => {
    const wrapper = await mountView({ prepare: (s) => { s.inventory = items } })

    expect(wrapper.findAllComponents(WardrobeItemCard)).toHaveLength(2)
    expect(wrapper.text()).toContain('2 pieces')
    expect(wrapper.text()).not.toContain('Your wardrobe is empty.')
  })

  it('goes back to the upload page', async () => {
    const wrapper = await mountView()

    await wrapper.findAll('button').find((b) => b.text().includes('Back to Upload')).trigger('click')

    expect(router.push).toHaveBeenCalledWith('/')
  })
})

describe('restoring after a reload', () => {
  it('loads saved items, asks for location and greets the user', async () => {
    const wrapper = await mountView({ stored: items })

    expect(store.inventory).toEqual(items)
    expect(store.getUserLocation).toHaveBeenCalledOnce()
    expect(store.messages).toEqual([
      { role: 'model', content: 'Hello! I have loaded your 2 items. How can I help you style them today?' },
    ])
    expect(wrapper.findAllComponents(WardrobeItemCard)).toHaveLength(2)
  })

  it('does not greet again when there is already a conversation', async () => {
    await mountView({ stored: items, prepare: (s) => { s.messages = [{ role: 'user', content: 'hi' }] } })

    expect(store.messages).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('does not greet when nothing was saved', async () => {
    await mountView()

    expect(store.messages).toEqual([])
    expect(store.getUserLocation).toHaveBeenCalledOnce()
  })

  it('leaves an already loaded wardrobe alone', async () => {
    await mountView({ prepare: (s) => { s.inventory = items } })

    expect(store.getUserLocation).not.toHaveBeenCalled()
    expect(store.messages).toEqual([])
  })
})

describe('chat panel', () => {
  it('starts closed on mobile and opens with the floating button', async () => {
    const wrapper = await mountView()
    const panel = () => wrapper.find('.chat-stub')
    expect(panel().classes()).toContain('translate-x-full')
    expect(panel().classes()).toContain('max-lg:invisible')
    expect(wrapper.find('[data-testid="chat-toggle"]').text()).toBe('Ask stylist')

    await wrapper.find('[data-testid="chat-toggle"]').trigger('click')

    expect(panel().classes()).toContain('translate-x-0')
    expect(panel().classes()).not.toContain('translate-x-full')
    expect(panel().classes()).not.toContain('max-lg:invisible')
    expect(wrapper.find('[data-testid="chat-toggle"]').exists()).toBe(false)
  })

  it('closes when the panel asks to', async () => {
    const wrapper = await mountView()
    await wrapper.find('[data-testid="chat-toggle"]').trigger('click')

    wrapper.findComponent(ChatPanel).vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.chat-stub').classes()).toContain('translate-x-full')
    expect(wrapper.find('[data-testid="chat-toggle"]').exists()).toBe(true)
  })
})

describe('jumping to the video', () => {
  const play = (wrapper, seconds) => wrapper.findComponent(WardrobeItemCard).vm.$emit('play-video', seconds)

  it('opens the modal and seeks when a video is available', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const wrapper = await mountView({ prepare: (s) => { s.inventory = items; s.videoUrl = 'blob:v' } })

    play(wrapper, 4)
    await flushPromises()

    expect(wrapper.findComponent(VideoModal).props('isOpen')).toBe(true)
    expect(wrapper.findComponent(VideoModal).props('videoUrl')).toBe('blob:v')
    expect(seekAndPlay).toHaveBeenCalledWith(4)
    expect(alert).not.toHaveBeenCalled()
  })

  it('warns when there is no uploaded video instead of opening the modal', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const wrapper = await mountView({ prepare: (s) => { s.inventory = items } })

    play(wrapper, 4)
    await flushPromises()

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('videos you uploaded'))
    expect(wrapper.findComponent(VideoModal).props('isOpen')).toBe(false)
    expect(seekAndPlay).not.toHaveBeenCalled()
  })

  it('opens the modal for a zero timestamp even without a video', async () => {
    const wrapper = await mountView({ prepare: (s) => { s.inventory = items } })

    play(wrapper, 0)
    await flushPromises()

    expect(wrapper.findComponent(VideoModal).props('isOpen')).toBe(true)
    expect(seekAndPlay).toHaveBeenCalledWith(0)
  })

  it('closes the modal when it asks to', async () => {
    const wrapper = await mountView({ prepare: (s) => { s.inventory = items; s.videoUrl = 'blob:v' } })
    play(wrapper, 4)
    await flushPromises()

    wrapper.findComponent(VideoModal).vm.$emit('close')
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(VideoModal).props('isOpen')).toBe(false)
  })
})

describe('highlighted items', () => {
  it('scrolls the first one into view', async () => {
    await mountView({ prepare: (s) => { s.inventory = items } })

    store.highlightedItems = ['b', 'a']
    await flushPromises()

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledOnce()
    expect(Element.prototype.scrollIntoView.mock.contexts[0].id).toBe('item-b')
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('does nothing for an id that is not rendered', async () => {
    await mountView({ prepare: (s) => { s.inventory = items } })

    store.highlightedItems = ['missing']
    await flushPromises()

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing when highlights are cleared', async () => {
    await mountView({ prepare: (s) => { s.inventory = items; s.highlightedItems = ['a'] } })

    store.highlightedItems = []
    await flushPromises()

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
