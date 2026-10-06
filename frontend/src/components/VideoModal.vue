<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-screen/90 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Garment video"
    @click.self="close"
    @keydown.esc="close"
  >
    <div class="relative flex w-full max-w-4xl items-center justify-center bg-screen">
      <button
        ref="closeButton"
        type="button"
        class="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center bg-paper text-ink transition-colors duration-200 hover:bg-accent hover:text-accent-ink"
        aria-label="Close video"
        @click="close"
      >
        <PhX :size="22" aria-hidden="true" />
      </button>

      <video
        ref="videoPlayer"
        :src="videoUrl"
        controls
        autoplay
        playsinline
        class="h-auto max-h-[80dvh] w-full bg-screen object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { PhX } from '@phosphor-icons/vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const videoPlayer = ref(null)
const closeButton = ref(null)

watch(() => props.isOpen, async (open) => {
  if (!open) return
  await nextTick()
  closeButton.value?.focus()
})

const close = () => {
  if (videoPlayer.value) {
      videoPlayer.value.pause();
  }
  emit('close')
}

const seekAndPlay = async (seconds) => {
  await nextTick();
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = seconds;
    try {
      await videoPlayer.value.play();
    } catch(e) { console.warn("Video play error", e); }
    }
}

defineExpose({
  seekAndPlay
})
</script>
