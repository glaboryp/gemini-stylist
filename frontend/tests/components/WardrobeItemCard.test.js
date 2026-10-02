import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WardrobeItemCard from '../../src/components/WardrobeItemCard.vue'
import { useWardrobeStore } from '../../src/stores/wardrobe'
import { freshPinia } from '../helpers/mount'

const baseItem = {
  id: 'i1',
  type: 'Top',
  subtype: 'Blouse',
  primary_color: { hex: '#ffffff', name: 'White' },
  season: 'Summer',
  formality: 5,
  emoji: '👚',
}

const mountCard = (item = {}) =>
  mount(WardrobeItemCard, {
    props: { item: { ...baseItem, ...item } },
    global: { plugins: [freshPinia()] },
  })

const barColor = (wrapper) => wrapper.find('div.absolute.top-0').element.style.backgroundColor

const asRgb = (color) => {
  const probe = document.createElement('div')
  probe.style.backgroundColor = color
  return probe.style.backgroundColor
}

describe('WardrobeItemCard', () => {
  beforeEach(() => freshPinia())

  it('renders the item details', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Blouse')
    expect(wrapper.text()).toContain('White • Top')
    expect(wrapper.text()).toContain('Summer')
    expect(wrapper.text()).toContain('5/10')
    expect(wrapper.text()).toContain('👚')
    expect(wrapper.attributes('id')).toBe('item-i1')
  })

  it('falls back to a default emoji', () => {
    expect(mountCard({ emoji: undefined }).text()).toContain('👔')
  })

  describe('color name', () => {
    it.each([
      ['a string', 'Burgundy', 'Burgundy • Top'],
      ['an object name', { name: 'Navy', hex: '#000080' }, 'Navy • Top'],
      ['an object label', { label: 'Olive' }, 'Olive • Top'],
      ['an object without a name', { hex: '#000' }, 'Unknown Color • Top'],
      ['a missing value', undefined, 'Unknown Color • Top'],
      ['a non-string primitive', 42, 'Unknown Color • Top'],
    ])('handles %s', (_label, color, expected) => {
      expect(mountCard({ primary_color: color }).text()).toContain(expected)
    })
  })

  describe('color bar', () => {
    it.each([
      ['a hex string', '#ff0000', '#ff0000'],
      ['a description containing a hex', 'navy blue (#1a2b3c)', '#1a2b3c'],
      ['a named color', 'navy', 'navy'],
      ['an object hex', { hex: '#00ff00' }, '#00ff00'],
      ['an object code', { code: '#0000ff' }, '#0000ff'],
      ['an object color', { color: '#123456' }, '#123456'],
      ['an object with no color keys', { name: 'x' }, '#e2e8f0'],
      ['a missing value', undefined, '#e2e8f0'],
      ['a non-string primitive', 42, '#e2e8f0'],
    ])('uses %s', (_label, color, expected) => {
      expect(barColor(mountCard({ primary_color: color }))).toBe(asRgb(expected))
    })
  })

  describe('highlighting', () => {
    it('is highlighted when the store lists the item', () => {
      const wrapper = mountCard()
      const store = useWardrobeStore()

      expect(wrapper.classes()).not.toContain('scale-[1.02]')

      store.highlightedItems = ['i1']
      return wrapper.vm.$nextTick().then(() => {
        expect(wrapper.classes()).toContain('scale-[1.02]')
      })
    })

    it('ignores highlights for other items', async () => {
      const wrapper = mountCard()
      useWardrobeStore().highlightedItems = ['other']
      await wrapper.vm.$nextTick()

      expect(wrapper.classes()).not.toContain('scale-[1.02]')
    })
  })

  describe('play button', () => {
    it('is hidden without a timestamp', () => {
      expect(mountCard().find('button').exists()).toBe(false)
    })

    it('emits play-video with the timestamp', async () => {
      const wrapper = mountCard({ timestamp_seconds: 12 })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('play-video')).toEqual([[12]])
    })

    it('is shown for a timestamp of zero', async () => {
      const wrapper = mountCard({ timestamp_seconds: 0 })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('play-video')).toEqual([[0]])
    })

    it('does not bubble the click to the card', async () => {
      const onClick = vi.fn()
      const wrapper = mount(
        { components: { WardrobeItemCard }, template: '<div @click="onClick"><WardrobeItemCard :item="item" /></div>', data: () => ({ item: { ...baseItem, timestamp_seconds: 3 } }), methods: { onClick } },
        { global: { plugins: [freshPinia()] } },
      )

      await wrapper.find('button').trigger('click')

      expect(onClick).not.toHaveBeenCalled()
    })
  })
})
