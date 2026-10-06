<template>
  <aside class="flex flex-col bg-surface">
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="-ml-2 flex h-11 w-11 items-center justify-center text-ink-soft transition-colors hover:text-ink lg:hidden"
          aria-label="Close chat"
          @click="$emit('close')"
        >
          <PhCaretLeft :size="22" aria-hidden="true" />
        </button>
        <div>
          <h3 class="font-display text-lg font-semibold leading-tight">Stylist Assistant</h3>
          <p v-if="isThinking" class="font-mono text-xs text-ink-soft" role="status">Thinking...</p>
        </div>
      </div>

      <div v-if="store.weather" data-testid="weather" class="flex flex-col items-end text-right">
        <div class="flex items-center gap-1.5">
          <component :is="weatherIcon" :size="20" aria-hidden="true" />
          <span class="font-mono text-sm font-medium">{{ Math.round(store.weather.temp) }}°C</span>
        </div>
        <span class="text-xs text-ink-soft">{{ store.weather.description }}</span>
      </div>
    </div>

    <div id="chat-container" class="flex-1 space-y-6 overflow-y-auto bg-paper p-5">
      <p v-if="store.messages.length === 0" class="max-w-[40ch] text-ink-soft">
        Ask me "What should I wear to a dinner?" or "Find me shoes that match this".
      </p>

      <div
        v-for="(msg, index) in store.messages"
        :key="index"
        :data-testid="'message-' + msg.role"
        :class="['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div
          :class="[
            'max-w-[92%] text-base leading-relaxed',
            msg.role === 'user' ? 'bg-ink px-4 py-3 text-paper' : 'border-l border-accent pl-4'
          ]"
        >
          <div data-testid="message-body" v-html="formatMessage(msg.content)"></div>

          <div v-if="msg.sources && msg.sources.length > 0" class="mt-5">
            <p class="mb-3 text-sm font-medium">
              Shopping Sources
              <span class="ml-1 font-mono text-xs text-ink-soft">{{ msg.sources.length }}</span>
            </p>

            <div class="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
              <ShoppingCard
                v-for="(source, sIndex) in msg.sources"
                :key="sIndex"
                :source="source"
                class="snap-start"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="isThinking" data-testid="thinking" class="w-full max-w-[70%] space-y-2 border-l border-accent pl-4" aria-hidden="true">
        <div class="h-3 w-full animate-pulse bg-line"></div>
        <div class="h-3 w-2/3 animate-pulse bg-line"></div>
      </div>
    </div>

    <div class="border-t border-line bg-surface p-5">
      <div v-if="store.messages.filter(m => m.role === 'user').length === 0" class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="chip in suggestions"
          :key="chip"
          type="button"
          data-testid="chip"
          class="min-h-11 border border-line bg-surface px-3 py-2 text-left text-sm transition-colors duration-200 hover:border-ink active:translate-y-px"
          @click="sendMessage(chip)"
        >
          {{ chip }}
        </button>
      </div>

      <form class="relative" @submit.prevent="sendMessage">
        <label for="chat-input" class="sr-only">Message the stylist</label>
        <input
          id="chat-input"
          v-model="newMessage"
          type="text"
          :placeholder="isThinking ? 'Stylist is thinking...' : 'Ask for outfit advice...'"
          class="h-12 w-full border border-line bg-paper pl-4 pr-14 text-base text-ink transition-colors focus:border-ink disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isThinking"
        >
        <button
          type="submit"
          class="absolute right-1 top-1 flex h-10 w-10 items-center justify-center bg-accent text-accent-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
          aria-label="Send message"
          :disabled="!newMessage.trim() || isThinking"
        >
          <PhArrowUp :size="20" aria-hidden="true" />
        </button>
      </form>
      <p class="mt-3 text-xs text-ink-soft">Powered by Gemini 3, grounded with Google Search</p>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import {
  PhArrowUp,
  PhCaretLeft,
  PhCloud,
  PhCloudFog,
  PhCloudRain,
  PhLightning,
  PhSnowflake,
  PhSun,
  PhThermometer,
  PhUmbrella,
} from '@phosphor-icons/vue'
import { useWardrobeStore } from '../stores/wardrobe'
import ShoppingCard from './ShoppingCard.vue'

defineEmits(['close'])

const store = useWardrobeStore()
const newMessage = ref('')
const isThinking = ref(false)

watch(() => store.messages.length, async () => {
    await nextTick()
    const container = document.getElementById('chat-container')
    if (container) container.scrollTop = container.scrollHeight
})

const sendMessage = async (textInput) => {
    const textToSend = (typeof textInput === 'string') ? textInput : newMessage.value;

    if (!textToSend.trim() || isThinking.value) return;

    if (typeof textInput !== 'string') newMessage.value = '';

    isThinking.value = true;

    await nextTick()
    const container = document.getElementById('chat-container')
    if (container) container.scrollTop = container.scrollHeight

    await store.sendMessage(textToSend);
    isThinking.value = false;
}

const escapeHtml = (text) => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatMessage = (content) => {
    if (!content) return '';
    let formatted = escapeHtml(content).replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

const weatherIcon = computed(() => {
    const code = store.weather?.code
    if (code === 0) return PhSun
    if (code >= 1 && code <= 3) return PhCloud
    if (code >= 45 && code <= 48) return PhCloudFog
    if (code >= 51 && code <= 67) return PhCloudRain
    if (code >= 71 && code <= 77) return PhSnowflake
    if (code >= 80 && code <= 82) return PhUmbrella
    if (code >= 95) return PhLightning
    return PhThermometer
})

const suggestions = computed(() => {
    const list = [
        "Work / Office Look",
        "Party / Night Out",
        "Casual Weekend"
    ];

    if (store.weather) {
        const temp = Math.round(store.weather.temp);
        const condition = store.weather.description || 'Current Weather';
        list.unshift(`Outfit for today (${condition}, ${temp}°C)`);
    } else {
        list.unshift("Outfit for today");
    }

    return list;
})
</script>
