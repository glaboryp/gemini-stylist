import { describe, expect, it } from 'vitest'
import { getColorName, getValidColor } from '../../src/utils/color'

describe('getValidColor', () => {
  it.each([
    ['a hex string', '#ff0000', '#ff0000'],
    ['a description containing a hex', 'navy blue (#1a2b3c)', '#1a2b3c'],
    ['a named color', 'navy', 'navy'],
    ['an object hex', { hex: '#00ff00' }, '#00ff00'],
    ['an object code', { code: '#0000ff' }, '#0000ff'],
    ['an object color', { color: '#123456' }, '#123456'],
    ['an object with no color keys', { name: 'x' }, '#c9ced2'],
    ['a missing value', undefined, '#c9ced2'],
    ['a non-string primitive', 42, '#c9ced2'],
  ])('uses %s', (_label, input, expected) => {
    expect(getValidColor(input)).toBe(expected)
  })
})

describe('getColorName', () => {
  it.each([
    ['a string', 'Burgundy', 'Burgundy'],
    ['an object name', { name: 'Navy' }, 'Navy'],
    ['an object label', { label: 'Olive' }, 'Olive'],
    ['an object without a name', { hex: '#000' }, 'Unknown Color'],
    ['a missing value', undefined, 'Unknown Color'],
    ['a non-string primitive', 42, 'Unknown Color'],
  ])('handles %s', (_label, input, expected) => {
    expect(getColorName(input)).toBe(expected)
  })
})
