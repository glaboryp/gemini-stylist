import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BrandMark from '../../src/components/BrandMark.vue'

describe('BrandMark', () => {
  it('shows the product name', () => {
    expect(mount(BrandMark).text()).toBe('Gemini Stylist')
  })

  it('draws the mark in the accent color and hides it from assistive tech', () => {
    const mark = mount(BrandMark).find('svg')

    expect(mark.classes()).toContain('text-accent')
    expect(mark.attributes('aria-hidden')).toBe('true')
    expect(mark.find('path').attributes('fill-rule')).toBe('evenodd')
  })
})
