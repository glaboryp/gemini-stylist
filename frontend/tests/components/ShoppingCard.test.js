import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShoppingCard from '../../src/components/ShoppingCard.vue'

const mountCard = (source) => mount(ShoppingCard, { props: { source } })

const favicon = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

describe('ShoppingCard', () => {
  it('renders the title, hostname and buy link', () => {
    const wrapper = mountCard({ title: 'Linen Shirt', uri: 'https://www.zara.com/es/shirt' })

    expect(wrapper.find('h4').text()).toBe('Linen Shirt')
    expect(wrapper.find('h4').attributes('title')).toBe('Linen Shirt')
    expect(wrapper.find('p').text()).toBe('zara.com')
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('https://www.zara.com/es/shirt')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.text()).toBe('Buy Now')
  })

  it('uses the Google favicon service first', () => {
    const wrapper = mountCard({ title: 'x', uri: 'https://hm.com/a' })

    expect(wrapper.find('img').attributes('src')).toBe(favicon('hm.com'))
  })

  describe('proxy urls', () => {
    it.each(['https://vertexaisearch.cloud.google.com/grounding/1', 'https://www.google.com/shopping/2'])(
      'uses a domain-like title for %s',
      (uri) => {
        const wrapper = mountCard({ title: 'www.hm.com', uri })

        expect(wrapper.find('p').text()).toBe('hm.com')
        expect(wrapper.find('img').attributes('src')).toBe(favicon('hm.com'))
      },
    )

    it('keeps the proxy hostname when the title is not a domain', () => {
      const wrapper = mountCard({ title: 'Nice shirt', uri: 'https://vertexaisearch.cloud.google.com/x' })

      expect(wrapper.find('p').text()).toBe('vertexaisearch.cloud.google.com')
    })
  })

  describe('invalid urls', () => {
    it('uses a domain-like title', () => {
      const wrapper = mountCard({ title: 'zara.com', uri: 'not a url' })

      expect(wrapper.find('p').text()).toBe('zara.com')
    })

    it('shows no hostname or logo otherwise', () => {
      const wrapper = mountCard({ title: 'Nice shirt', uri: 'not a url' })

      expect(wrapper.find('p').text()).toBe('')
      expect(wrapper.find('img').attributes('src') || '').toBe('')
    })

    it('rejects titles with spaces even if they contain a dot', () => {
      const wrapper = mountCard({ title: 'Buy at zara.com now', uri: 'nope' })

      expect(wrapper.find('p').text()).toBe('')
    })
  })

  describe('logo fallbacks', () => {
    it('switches to Clearbit after the first error', async () => {
      const wrapper = mountCard({ title: 'x', uri: 'https://hm.com/a' })

      await wrapper.find('img').trigger('error')

      expect(wrapper.find('img').attributes('src')).toBe('https://logo.clearbit.com/hm.com')
    })

    it('drops the source after the second error', async () => {
      const wrapper = mountCard({ title: 'x', uri: 'https://hm.com/a' })

      await wrapper.find('img').trigger('error')
      await wrapper.find('img').trigger('error')

      expect(wrapper.find('img').attributes('src') || '').toBe('')
    })

    it('shows an emoji placeholder after the third error, only once', async () => {
      const wrapper = mountCard({ title: 'x', uri: 'https://hm.com/a' })

      for (let i = 0; i < 4; i++) await wrapper.find('img').trigger('error')

      const placeholders = wrapper.findAll('.fallback-icon')
      expect(placeholders).toHaveLength(1)
      expect(placeholders[0].text()).toBe('🛍️')
      expect(wrapper.find('img').element.style.display).toBe('none')
    })
  })
})
