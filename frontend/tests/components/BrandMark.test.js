import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BrandMark from '../../src/components/BrandMark.vue'

describe('BrandMark', () => {
  it('shows the product name', () => {
    expect(mount(BrandMark).text()).toBe('Gemini Stylist')
  })
})
