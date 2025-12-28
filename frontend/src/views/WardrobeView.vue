<template>
  <div class="h-screen bg-premium-bg font-sans text-slate-800 relative overflow-hidden flex flex-col">
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm h-16 shrink-0">
      <div class="flex items-center gap-3">
        <img src="/logo_bgremove.png" alt="Gemini Stylist Logo" class="h-12 w-auto" />
        <h1 class="text-2xl font-serif font-bold tracking-tight text-slate-900">Gemini Stylist</h1>
      </div>
      <button @click="$router.push('/')" class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider">
        Back to Upload
      </button>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <main class="w-full overflow-y-auto p-6 lg:p-10 scroll-smooth border-r border-slate-200">
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <h2 class="text-4xl font-serif font-medium text-slate-900 mb-2">My Collection</h2>
            <p class="text-slate-500 font-light">
              {{ store.inventory.length }} items curated by AI
            </p>
          </div>

          <div v-if="store.inventory.length === 0" class="flex flex-col items-center justify-center py-32 text-slate-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <p class="text-lg font-light">Your wardrobe is empty.</p>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-6 auto-rows-fr">
            <WardrobeItemCard 
                v-for="item in store.inventory" 
                :key="item.id" 
                :item="item"
                @play-video="handleJumpToVideo"
            />
          </div>
        </div>
      </main>
        
      <ChatPanel />
    </div>
    
    <VideoModal 
      ref="videoModalRef"
      :is-open="isVideoModalOpen" 
      :video-url="store.videoUrl"
      @close="isVideoModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useWardrobeStore } from '../stores/wardrobe'
import { useRouter } from 'vue-router'
import WardrobeItemCard from '../components/WardrobeItemCard.vue'
import ChatPanel from '../components/ChatPanel.vue'
import VideoModal from '../components/VideoModal.vue'

const router = useRouter()
const store = useWardrobeStore()

const isVideoModalOpen = ref(false)
const videoModalRef = ref(null)

const handleJumpToVideo = async (seconds) => {
  if (!store.videoUrl) {
    if (seconds > 0 && !store.videoUrl) {
        alert("Video playback is only available for uploaded videos, not in demo mode.");
        return;
    }
  }
  isVideoModalOpen.value = true;
  await nextTick();
  if (videoModalRef.value) {
    await videoModalRef.value.seekAndPlay(seconds);
    }
}

// Watch for highlighted items to scroll into view
watch(() => store.highlightedItems, async (newItems) => {
    if (newItems && newItems.length > 0) {
        await nextTick();
        const firstId = newItems[0];
        const element = document.getElementById(`item-${firstId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}, { deep: true });
</script>