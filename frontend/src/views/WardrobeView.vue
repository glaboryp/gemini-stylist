<template>
  <div class="flex h-[100dvh] flex-col overflow-hidden bg-paper font-sans text-ink">
    <header class="flex h-16 shrink-0 items-center justify-between border-b border-line px-6">
      <BrandMark />
      <button
        type="button"
        class="inline-flex h-11 items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        @click="$router.push('/')"
      >
        <PhArrowLeft :size="18" aria-hidden="true" />
        <span>Back to Upload</span>
      </button>
    </header>

    <div class="flex min-h-0 flex-1">
      <main class="flex-1 overflow-y-auto scroll-smooth px-6 pb-24 pt-8 lg:px-12 lg:py-10">
        <div class="mx-auto max-w-5xl">
          <div class="mb-8">
            <h2 class="font-display text-4xl font-semibold tracking-tight">My Collection</h2>
            <p class="mt-2 font-mono text-sm text-ink-soft">
              {{ store.inventory.length }} {{ store.inventory.length === 1 ? 'piece' : 'pieces' }}
            </p>
          </div>

          <div v-if="store.inventory.length === 0" class="flex flex-col items-start gap-4 border border-line bg-surface p-8 sm:p-12">
            <PhCoatHanger :size="40" aria-hidden="true" />
            <p class="font-display text-2xl font-semibold">Your wardrobe is empty.</p>
            <p class="max-w-[48ch] text-ink-soft">Upload a short video of your closet and every piece will show up here as a swatch.</p>
            <button
              type="button"
              class="inline-flex h-11 items-center gap-2 bg-accent px-6 font-medium text-accent-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px"
              @click="$router.push('/')"
            >
              <span>Upload Video</span>
              <PhArrowRight :size="18" aria-hidden="true" />
            </button>
          </div>

          <div v-else class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <WardrobeItemCard
                v-for="item in store.inventory"
                :key="item.id"
                :item="item"
                @play-video="handleJumpToVideo"
            />
          </div>
        </div>
      </main>

      <ChatPanel
        class="border-l border-line transition-[transform,visibility] duration-300 ease-out"
        :class="[
            'fixed inset-0 z-40 h-full w-full',
            'lg:relative lg:inset-auto lg:z-auto lg:w-[26rem] lg:translate-x-0 xl:w-[30rem]',
            isChatOpen ? 'translate-x-0' : 'max-lg:invisible translate-x-full'
        ]"
        @close="isChatOpen = false"
      />

      <button
        v-if="!isChatOpen"
        type="button"
        data-testid="chat-toggle"
        class="fixed bottom-5 right-5 z-30 flex h-14 items-center justify-center gap-2 bg-accent px-5 font-medium text-accent-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px lg:hidden"
        @click="isChatOpen = true"
      >
        <PhChatText :size="24" aria-hidden="true" />
        <span>Ask stylist</span>
      </button>
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
import { PhArrowLeft, PhArrowRight, PhChatText, PhCoatHanger } from '@phosphor-icons/vue'
import { useWardrobeStore } from '../stores/wardrobe'
import BrandMark from '../components/BrandMark.vue'
import WardrobeItemCard from '../components/WardrobeItemCard.vue'
import ChatPanel from '../components/ChatPanel.vue'
import VideoModal from '../components/VideoModal.vue'

const store = useWardrobeStore()
const isChatOpen = ref(false)
const isVideoModalOpen = ref(false)
const videoModalRef = ref(null)

if (store.inventory.length === 0) {
    store.loadState();
    store.getUserLocation();

    if (store.inventory.length > 0 && store.messages.length === 0) {
        store.messages.push({
            role: 'model',
            content: `Hello! I have loaded your ${store.inventory.length} items. How can I help you style them today?`
        });
    }
}

const handleJumpToVideo = async (seconds) => {
  if (!store.videoUrl) {
    if (seconds > 0 && !store.videoUrl) {
        alert("Video playback is only available for videos you uploaded.");
        return;
    }
  }
  isVideoModalOpen.value = true;
  await nextTick();
  if (videoModalRef.value) {
    await videoModalRef.value.seekAndPlay(seconds);
    }
}

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
