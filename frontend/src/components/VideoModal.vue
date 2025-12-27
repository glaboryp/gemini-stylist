<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="close">
    <div class="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full relative group flex justify-center items-center">
      <button @click="close" class="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
      
      <video 
        ref="videoPlayer" 
        :src="videoUrl"
        controls 
        autoplay
        playsinline
        class="w-full h-auto max-h-[80vh] object-contain bg-transparent rounded-lg shadow-2xl"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

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
