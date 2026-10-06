import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import {
  PhCloud,
  PhCloudFog,
  PhCloudRain,
  PhLightning,
  PhSnowflake,
  PhSun,
  PhThermometer,
  PhUmbrella,
} from '@phosphor-icons/vue'
import ChatPanel from '../../src/components/ChatPanel.vue'
import ShoppingCard from '../../src/components/ShoppingCard.vue'
import { useWardrobeStore } from '../../src/stores/wardrobe'
import { freshPinia } from '../helpers/mount'

let store
let sendMessage

const mountPanel = () =>
  mount(ChatPanel, { global: { plugins: [freshPinia()] }, attachTo: document.body })

const setup = () => {
  const wrapper = mountPanel()
  store = useWardrobeStore()
  sendMessage = vi.spyOn(store, 'sendMessage').mockResolvedValue()
  return wrapper
}

const input = (wrapper) => wrapper.find('input[type="text"]')
const submit = (wrapper) => wrapper.find('button[type="submit"]')
const chips = (wrapper) => wrapper.findAll('[data-testid="chip"]')
const modelBody = (wrapper) => wrapper.find('[data-testid="message-model"] [data-testid="message-body"]')
const userBody = (wrapper) => wrapper.find('[data-testid="message-user"] [data-testid="message-body"]')

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('empty state', () => {
  it('shows the hint and suggestion chips', () => {
    const wrapper = setup()

    expect(wrapper.text()).toContain('Ask me "What should I wear to a dinner?"')
    expect(chips(wrapper).map((c) => c.text())).toEqual([
      'Outfit for today',
      'Work / Office Look',
      'Party / Night Out',
      'Casual Weekend',
    ])
  })

  it('disables sending while the input is blank', async () => {
    const wrapper = setup()
    expect(submit(wrapper).attributes('disabled')).toBeDefined()

    await input(wrapper).setValue('   ')
    expect(submit(wrapper).attributes('disabled')).toBeDefined()

    await input(wrapper).setValue('hi')
    expect(submit(wrapper).attributes('disabled')).toBeUndefined()
  })
})

describe('messages', () => {
  it('renders user and model messages', async () => {
    const wrapper = setup()
    store.messages = [
      { role: 'user', content: 'hello' },
      { role: 'model', content: 'hi there' },
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('hello')
    expect(wrapper.text()).toContain('hi there')
    expect(wrapper.text()).not.toContain('Ask me "What should I wear')
  })

  it('formats bold, italic and line breaks', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'model', content: '**Bold** and *soft*\nnext' }]
    await wrapper.vm.$nextTick()

    const html = modelBody(wrapper).html()
    expect(html).toContain('<strong class="font-semibold">Bold</strong>')
    expect(html).toContain('<em class="italic">soft</em>')
    expect(html).toContain('<br>')
  })

  it.each([
    ['an image with an inline handler', '<img src=x onerror="alert(1)">', 'img'],
    ['a script tag', '<script>alert(1)</script>', 'script'],
    ['an anchor', '<a href="javascript:alert(1)">x</a>', 'a'],
  ])('does not render %s as HTML', async (_label, content, tag) => {
    const wrapper = setup()
    store.messages = [{ role: 'model', content }]
    await wrapper.vm.$nextTick()

    const bubble = modelBody(wrapper)
    expect(bubble.find(tag).exists()).toBe(false)
    expect(bubble.text()).toBe(content)
  })

  it('escapes user messages too', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'user', content: '<b>hi</b> & "bye" \'now\'' }]
    await wrapper.vm.$nextTick()

    const bubble = userBody(wrapper)
    expect(bubble.find('b').exists()).toBe(false)
    expect(bubble.text()).toBe('<b>hi</b> & "bye" \'now\'')
  })

  it('keeps formatting while escaping markup inside it', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'model', content: '**<i>bold</i>**\nnext' }]
    await wrapper.vm.$nextTick()

    const bubble = modelBody(wrapper)
    expect(bubble.find('strong').text()).toBe('<i>bold</i>')
    expect(bubble.find('i').exists()).toBe(false)
    expect(bubble.find('br').exists()).toBe(true)
  })

  it('renders an empty bubble for a message without content', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'model' }]
    await wrapper.vm.$nextTick()

    expect(modelBody(wrapper).text()).toBe('')
  })

  it('renders a shopping card per source with a counter', async () => {
    const wrapper = setup()
    store.messages = [
      {
        role: 'model',
        content: 'Try these',
        sources: [
          { title: 'A', uri: 'https://a.com' },
          { title: 'B', uri: 'https://b.com' },
        ],
      },
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.findAllComponents(ShoppingCard)).toHaveLength(2)
    expect(wrapper.text()).toContain('Shopping Sources')
  })

  it('omits the sources block for empty sources', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'model', content: 'x', sources: [] }]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Shopping Sources')
  })

  it('scrolls the chat to the bottom when a message arrives', async () => {
    const wrapper = setup()
    const container = wrapper.find('#chat-container').element
    Object.defineProperty(container, 'scrollHeight', { value: 500, configurable: true })

    store.messages = [{ role: 'user', content: 'a' }]
    await flushPromises()

    expect(container.scrollTop).toBe(500)
  })
})

describe('suggestion chips', () => {
  it('hide once the user has written a message', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'user', content: 'hi' }]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Work / Office Look')
  })

  it('stay visible when only the model has spoken', async () => {
    const wrapper = setup()
    store.messages = [{ role: 'model', content: 'welcome' }]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Work / Office Look')
  })

  it('send their text without touching the input', async () => {
    const wrapper = setup()
    await input(wrapper).setValue('draft')

    await chips(wrapper)[1].trigger('click')
    await flushPromises()

    expect(sendMessage).toHaveBeenCalledWith('Work / Office Look')
    expect(input(wrapper).element.value).toBe('draft')
  })

  it('mention the weather when it is known', async () => {
    const wrapper = setup()
    store.weather = { temp: 18.6, code: 61, description: 'Rainy' }
    await wrapper.vm.$nextTick()

    expect(chips(wrapper)[0].text()).toBe('Outfit for today (Rainy, 19°C)')
  })

  it('use a generic condition when the weather has no description', async () => {
    const wrapper = setup()
    store.weather = { temp: 10, code: 0 }
    await wrapper.vm.$nextTick()

    expect(chips(wrapper)[0].text()).toBe('Outfit for today (Current Weather, 10°C)')
  })
})

describe('weather widget', () => {
  it('is hidden without weather', () => {
    expect(setup().text()).not.toContain('°C')
  })

  it.each([
    [0, PhSun],
    [2, PhCloud],
    [45, PhCloudFog],
    [61, PhCloudRain],
    [73, PhSnowflake],
    [81, PhUmbrella],
    [96, PhLightning],
    [4, PhThermometer],
  ])('shows the icon for code %i', async (code, icon) => {
    const wrapper = setup()
    store.weather = { temp: 20.4, code, description: 'Whatever' }
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="weather"]').findComponent(icon).exists()).toBe(true)
    expect(wrapper.text()).toContain('20°C')
    expect(wrapper.text()).toContain('Whatever')
  })
})

describe('sending', () => {
  it('sends the typed message and clears the input', async () => {
    const wrapper = setup()
    await input(wrapper).setValue('what should I wear?')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(sendMessage).toHaveBeenCalledWith('what should I wear?')
    expect(input(wrapper).element.value).toBe('')
  })

  it('does not send blank messages', async () => {
    const wrapper = setup()
    await input(wrapper).setValue('   ')

    await wrapper.find('form').trigger('submit')

    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('shows the thinking state until the reply arrives', async () => {
    const wrapper = setup()
    let finish
    sendMessage.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    await input(wrapper).setValue('hi')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Thinking...')
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    expect(input(wrapper).attributes('placeholder')).toBe('Stylist is thinking...')
    expect(wrapper.find('[data-testid="thinking"]').exists()).toBe(true)

    finish()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Thinking...')
    expect(wrapper.find('[data-testid="thinking"]').exists()).toBe(false)
    expect(input(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('ignores new messages while thinking', async () => {
    const wrapper = setup()
    sendMessage.mockReturnValue(new Promise(() => {}))
    await input(wrapper).setValue('first')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await chips(wrapper)[0].trigger('click')

    expect(sendMessage).toHaveBeenCalledTimes(1)
  })

  it('scrolls to the bottom right after sending', async () => {
    const wrapper = setup()
    const container = wrapper.find('#chat-container').element
    Object.defineProperty(container, 'scrollHeight', { value: 900, configurable: true })
    await input(wrapper).setValue('hi')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(container.scrollTop).toBe(900)
  })
})

describe('when the panel disappears mid-update', () => {
  it('does not fail if it is removed right after sending', async () => {
    const wrapper = setup()
    await input(wrapper).setValue('hi')

    wrapper.find('form').trigger('submit')
    wrapper.unmount()

    await flushPromises()
    expect(sendMessage).toHaveBeenCalledWith('hi')
  })

  it('does not fail if it is removed while auto-scrolling a new message', async () => {
    const wrapper = setup()

    store.messages = [{ role: 'user', content: 'a' }]
    await Promise.resolve()
    wrapper.unmount()

    await flushPromises()
  })
})

describe('close button', () => {
  it('emits close', async () => {
    const wrapper = setup()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
