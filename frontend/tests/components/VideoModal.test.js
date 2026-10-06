import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VideoModal from '../../src/components/VideoModal.vue'

let play
let pause

beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})

const mountModal = (props = {}) =>
  mount(VideoModal, { props: { isOpen: true, videoUrl: 'blob:video', ...props }, attachTo: document.body })

describe('VideoModal', () => {
  it('renders nothing when closed', () => {
    const wrapper = mountModal({ isOpen: false })

    expect(wrapper.find('video').exists()).toBe(false)
  })

  it('renders the video with the given url when open', () => {
    const wrapper = mountModal()

    expect(wrapper.find('video').attributes('src')).toBe('blob:video')
    expect(wrapper.find('video').attributes('controls')).toBeDefined()
  })

  it('pauses the video and emits close from the close button', async () => {
    const wrapper = mountModal()

    await wrapper.find('button').trigger('click')

    expect(pause).toHaveBeenCalledOnce()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when the backdrop is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('[role="dialog"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('stays open when the content is clicked', async () => {
    const wrapper = mountModal()

    await wrapper.find('video').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes with the Escape key', async () => {
    const wrapper = mountModal()

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(pause).toHaveBeenCalledOnce()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('is announced as a modal dialog', () => {
    const dialog = mountModal().find('[role="dialog"]')

    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-label')).toBe('Garment video')
  })

  it('moves focus to the close button when it opens', async () => {
    const wrapper = mountModal({ isOpen: false })

    await wrapper.setProps({ isOpen: true })
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('button').element)
  })

  it('does not steal focus when it closes', async () => {
    const wrapper = mountModal()
    const outside = document.createElement('input')
    document.body.appendChild(outside)
    outside.focus()

    await wrapper.setProps({ isOpen: false })
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(outside)
  })

  it('seekAndPlay jumps to the time and plays', async () => {
    const wrapper = mountModal()

    await wrapper.vm.seekAndPlay(12)

    expect(wrapper.find('video').element.currentTime).toBe(12)
    expect(play).toHaveBeenCalledOnce()
  })

  it('seekAndPlay survives a rejected play()', async () => {
    play.mockRejectedValue(new Error('blocked'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountModal()

    await expect(wrapper.vm.seekAndPlay(3)).resolves.toBeUndefined()

    expect(warn).toHaveBeenCalled()
  })

  it('seekAndPlay does nothing while closed', async () => {
    const wrapper = mountModal({ isOpen: false })

    await wrapper.vm.seekAndPlay(5)

    expect(play).not.toHaveBeenCalled()
  })

  it('closes without a player', async () => {
    const wrapper = mountModal()
    await wrapper.setProps({ isOpen: false })

    wrapper.vm.$.setupState.close()

    expect(pause).not.toHaveBeenCalled()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
