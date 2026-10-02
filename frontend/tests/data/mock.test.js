import { describe, expect, it } from 'vitest'
import { mockInventory } from '../../src/data/mock'

describe('mockInventory', () => {
  it('has unique ids', () => {
    const ids = mockInventory.map((item) => item.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(mockInventory.map((item) => [item.id, item]))('%s has everything the card needs', (_id, item) => {
    expect(item.type).toBeTruthy()
    expect(item.subtype).toBeTruthy()
    expect(item.season).toBeTruthy()
    expect(item.emoji).toBeTruthy()
    expect(item.primary_color.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(item.primary_color.name).toBeTruthy()
    expect(item.formality).toBeGreaterThanOrEqual(1)
    expect(item.formality).toBeLessThanOrEqual(10)
    expect(item.timestamp_seconds).toBeGreaterThanOrEqual(0)
  })
})
