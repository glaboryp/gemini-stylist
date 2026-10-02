import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useWardrobeStore } from '../../src/stores/wardrobe'
import { mockInventory } from '../../src/data/mock'
import { freshPinia } from '../helpers/mount'

vi.mock('axios')

const INVENTORY_KEY = 'gemini_wardrobe_inventory'
const LOCATION_KEY = 'gemini_wardrobe_location'

let store

beforeEach(() => {
  localStorage.clear()
  freshPinia()
  store = useWardrobeStore()
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:video'),
    revokeObjectURL: vi.fn(),
  }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('initial state', () => {
  it('starts empty', () => {
    expect(store.inventory).toEqual([])
    expect(store.messages).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.videoUrl).toBeNull()
    expect(store.highlightedItems).toEqual([])
    expect(store.userLocation).toEqual({ lat: null, lon: null })
    expect(store.weather).toBeNull()
  })
})

describe('persistence', () => {
  it('saveState writes inventory and location to localStorage', () => {
    store.inventory = [{ id: '1' }]
    store.userLocation = { lat: 1, lon: 2 }

    store.saveState()

    expect(JSON.parse(localStorage.getItem(INVENTORY_KEY))).toEqual([{ id: '1' }])
    expect(JSON.parse(localStorage.getItem(LOCATION_KEY))).toEqual({ lat: 1, lon: 2 })
  })

  it('loadState restores what saveState wrote', () => {
    store.inventory = [{ id: '1' }]
    store.userLocation = { lat: 1, lon: 2 }
    store.saveState()

    freshPinia()
    const reloaded = useWardrobeStore()
    reloaded.loadState()

    expect(reloaded.inventory).toEqual([{ id: '1' }])
    expect(reloaded.userLocation).toEqual({ lat: 1, lon: 2 })
  })

  it('loadState leaves defaults when nothing is stored', () => {
    store.loadState()

    expect(store.inventory).toEqual([])
    expect(store.userLocation).toEqual({ lat: null, lon: null })
  })

  it('clearWardrobe resets state and removes stored data', () => {
    store.inventory = [{ id: '1' }]
    store.messages = [{ role: 'user', content: 'hi' }]
    store.videoUrl = 'blob:x'
    store.userLocation = { lat: 1, lon: 2 }
    store.weather = { temp: 1 }
    store.error = 'boom'
    store.saveState()

    store.clearWardrobe()

    expect(store.inventory).toEqual([])
    expect(store.messages).toEqual([])
    expect(store.videoUrl).toBeNull()
    expect(store.userLocation).toEqual({ lat: null, lon: null })
    expect(store.weather).toBeNull()
    expect(store.error).toBeNull()
    expect(localStorage.getItem(INVENTORY_KEY)).toBeNull()
    expect(localStorage.getItem(LOCATION_KEY)).toBeNull()
  })
})

describe('loadDemoData', () => {
  it('loads the mock inventory, greets the user and persists', () => {
    store.videoUrl = 'blob:x'

    store.loadDemoData()

    expect(store.inventory).toEqual(mockInventory)
    expect(store.videoUrl).toBeNull()
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0]).toMatchObject({ role: 'model' })
    expect(store.messages[0].content).toContain('Demo Mode')
    expect(JSON.parse(localStorage.getItem(INVENTORY_KEY))).toEqual(mockInventory)
  })
})

describe('getWeatherDescription', () => {
  it.each([
    [0, 'Clear'],
    [1, 'Cloudy'],
    [3, 'Cloudy'],
    [45, 'Foggy'],
    [48, 'Foggy'],
    [51, 'Rainy'],
    [67, 'Rainy'],
    [71, 'Snowy'],
    [77, 'Snowy'],
    [80, 'Showers'],
    [82, 'Showers'],
    [95, 'Thunderstorm'],
    [99, 'Thunderstorm'],
    [4, 'Unknown'],
    [50, 'Unknown'],
    [78, 'Unknown'],
    [83, 'Unknown'],
  ])('maps code %i to %s', (code, description) => {
    expect(store.getWeatherDescription(code)).toBe(description)
  })
})

describe('fetchWeather', () => {
  const respondWith = (payload) =>
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => payload })))

  it('does nothing without a location', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    await store.fetchWeather()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(store.weather).toBeNull()
  })

  it('stores temperature, code and description', async () => {
    store.userLocation = { lat: 40.4, lon: -3.7 }
    respondWith({ current: { temperature_2m: 18.5, weather_code: 61 } })

    await store.fetchWeather()

    expect(fetch.mock.calls[0][0]).toContain('latitude=40.4')
    expect(fetch.mock.calls[0][0]).toContain('longitude=-3.7')
    expect(store.weather).toEqual({ temp: 18.5, code: 61, description: 'Rainy' })
  })

  it('keeps weather unset when the response has no current data', async () => {
    store.userLocation = { lat: 1, lon: 2 }
    respondWith({})

    await store.fetchWeather()

    expect(store.weather).toBeNull()
  })

  it('swallows network errors', async () => {
    store.userLocation = { lat: 1, lon: 2 }
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))

    await expect(store.fetchWeather()).resolves.toBeUndefined()

    expect(store.weather).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('getUserLocation', () => {
  const stubGeolocation = (impl) =>
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: vi.fn(impl) } })

  it('reuses a stored location and only refreshes the weather', () => {
    store.userLocation = { lat: 1, lon: 2 }
    stubGeolocation(() => {})
    const fetchWeather = vi.spyOn(store, 'fetchWeather').mockResolvedValue()

    store.getUserLocation()

    expect(fetchWeather).toHaveBeenCalledOnce()
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled()
  })

  it('stores the position when permission is granted', () => {
    stubGeolocation((success) => success({ coords: { latitude: 40.4, longitude: -3.7 } }))
    const fetchWeather = vi.spyOn(store, 'fetchWeather').mockResolvedValue()

    store.getUserLocation()

    expect(store.userLocation).toEqual({ lat: 40.4, lon: -3.7 })
    expect(JSON.parse(localStorage.getItem(LOCATION_KEY))).toEqual({ lat: 40.4, lon: -3.7 })
    expect(fetchWeather).toHaveBeenCalledOnce()
  })

  it('fails silently when permission is denied', () => {
    stubGeolocation((_success, failure) => failure({ message: 'denied' }))
    const fetchWeather = vi.spyOn(store, 'fetchWeather').mockResolvedValue()

    store.getUserLocation()

    expect(store.userLocation).toEqual({ lat: null, lon: null })
    expect(fetchWeather).not.toHaveBeenCalled()
  })

  it('does nothing when geolocation is unavailable', () => {
    vi.stubGlobal('navigator', {})

    expect(() => store.getUserLocation()).not.toThrow()
    expect(store.userLocation).toEqual({ lat: null, lon: null })
  })
})

describe('highlightItems', () => {
  it('sets the highlighted ids', () => {
    store.highlightItems(['a', 'b'])

    expect(store.highlightedItems).toEqual(['a', 'b'])
  })

  it('clears highlights for a missing value', () => {
    store.highlightedItems = ['a']

    store.highlightItems(undefined)

    expect(store.highlightedItems).toEqual([])
  })
})

describe('analyzeVideo', () => {
  const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })

  it('posts the file and appends items with unique ids', async () => {
    store.inventory = [{ id: 'existing' }]
    axios.post.mockResolvedValue({
      data: {
        inventory: [{ subtype: 'Tee' }, { subtype: 'Jeans' }],
        welcome_message: 'Welcome',
        suggestion_starter: 'Nice style',
      },
    })

    await store.analyzeVideo(file)

    const [url, body] = axios.post.mock.calls[0]
    expect(url).toMatch(/\/analyze-video$/)
    expect(body.get('file')).toBe(file)
    expect(body.has('lat')).toBe(false)
    expect(store.inventory).toHaveLength(3)
    expect(store.inventory[0]).toEqual({ id: 'existing' })
    const ids = store.inventory.slice(1).map((item) => item.id)
    expect(new Set(ids).size).toBe(2)
    expect(store.inventory[1].subtype).toBe('Tee')
    expect(store.messages).toEqual([
      { role: 'model', content: 'Welcome' },
      { role: 'model', content: '💡 Hint: Nice style' },
    ])
    expect(JSON.parse(localStorage.getItem(INVENTORY_KEY))).toHaveLength(3)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('sends the location when known', async () => {
    store.userLocation = { lat: 40.4, lon: -3.7 }
    axios.post.mockResolvedValue({ data: { inventory: [] } })

    await store.analyzeVideo(file)

    const body = axios.post.mock.calls[0][1]
    expect(body.get('lat')).toBe('40.4')
    expect(body.get('lon')).toBe('-3.7')
  })

  it('clears previous chat and replaces the video url', async () => {
    store.messages = [{ role: 'user', content: 'old' }]
    store.videoUrl = 'blob:old'
    axios.post.mockResolvedValue({ data: { inventory: [] } })

    await store.analyzeVideo(file)

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:old')
    expect(store.videoUrl).toBe('blob:video')
    expect(store.messages).toEqual([])
  })

  it('skips messages that the backend did not send', async () => {
    axios.post.mockResolvedValue({ data: { inventory: [{ subtype: 'Tee' }] } })

    await store.analyzeVideo(file)

    expect(store.messages).toEqual([])
  })

  it('ignores a response without inventory', async () => {
    axios.post.mockResolvedValue({ data: {} })

    await store.analyzeVideo(file)

    expect(store.inventory).toEqual([])
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('reports an error and stops loading when the request fails', async () => {
    axios.post.mockRejectedValue(new Error('500'))

    await store.analyzeVideo(file)

    expect(store.error).toBe('Error analyzing video. Please try again.')
    expect(store.loading).toBe(false)
    expect(store.inventory).toEqual([])
  })

  it('is loading while the request is in flight', async () => {
    let resolve
    axios.post.mockReturnValue(new Promise((r) => { resolve = r }))

    const pending = store.analyzeVideo(file)

    expect(store.loading).toBe(true)
    resolve({ data: { inventory: [] } })
    await pending
    expect(store.loading).toBe(false)
  })
})

describe('sendMessage', () => {
  it('sends history, inventory and location and stores the reply', async () => {
    store.inventory = [{ id: 'a' }]
    store.userLocation = { lat: 1, lon: 2 }
    store.messages = [{ role: 'model', content: 'hello' }]
    store.highlightedItems = ['old']
    axios.post.mockResolvedValue({
      data: { text: 'Wear a coat', related_item_ids: ['a'], sources: [{ title: 'Shop', uri: 'https://x.y' }] },
    })

    await store.sendMessage('what now?')

    const [url, payload] = axios.post.mock.calls[0]
    expect(url).toMatch(/\/api\/chat$/)
    expect(payload).toEqual({
      user_message: 'what now?',
      chat_history: [{ role: 'model', content: 'hello' }],
      inventory_context: [{ id: 'a' }],
      lat: 1,
      lon: 2,
    })
    expect(store.messages).toEqual([
      { role: 'model', content: 'hello' },
      { role: 'user', content: 'what now?' },
      { role: 'model', content: 'Wear a coat', sources: [{ title: 'Shop', uri: 'https://x.y' }] },
    ])
    expect(store.highlightedItems).toEqual(['a'])
  })

  it('shows the user message before the reply arrives', async () => {
    let resolve
    axios.post.mockReturnValue(new Promise((r) => { resolve = r }))

    const pending = store.sendMessage('hi')

    expect(store.messages).toEqual([{ role: 'user', content: 'hi' }])
    resolve({ data: { text: 'hello' } })
    await pending
  })

  it('clears the previous highlights as soon as a message is sent', async () => {
    store.highlightedItems = ['old']
    let resolve
    axios.post.mockReturnValue(new Promise((r) => { resolve = r }))

    const pending = store.sendMessage('hi')

    expect(store.highlightedItems).toEqual([])
    resolve({ data: { text: 'ok' } })
    await pending
    expect(store.highlightedItems).toEqual([])
  })

  it('falls back to a default text when the reply has none', async () => {
    axios.post.mockResolvedValue({ data: {} })

    await store.sendMessage('hi')

    expect(store.messages.at(-1).content).toBe("I'm not sure what to say.")
    expect(store.highlightedItems).toEqual([])
  })

  it('ignores related_item_ids that are not an array', async () => {
    axios.post.mockResolvedValue({ data: { text: 'ok', related_item_ids: 'a' } })

    await store.sendMessage('hi')

    expect(store.highlightedItems).toEqual([])
  })

  it('ignores an empty response body', async () => {
    axios.post.mockResolvedValue({ data: null })

    await store.sendMessage('hi')

    expect(store.messages).toEqual([{ role: 'user', content: 'hi' }])
  })

  it('apologises when the request fails', async () => {
    axios.post.mockRejectedValue(new Error('network'))

    await store.sendMessage('hi')

    expect(store.messages.at(-1)).toEqual({
      role: 'model',
      content: "Sorry, I'm having trouble connecting to the stylist brain right now.",
    })
  })
})
