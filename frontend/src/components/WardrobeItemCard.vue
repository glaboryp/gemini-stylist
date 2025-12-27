<template>
  <div 
    :class="[
      'group relative bg-white rounded-2xl shadow-sm transition-all duration-300 ease-out overflow-hidden border flex flex-col',
      isHighlighted ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] ring-2 ring-amber-100 scale-[1.02]' : 'border-slate-50 hover:shadow-xl hover:-translate-y-1'
    ]"
    :id="'item-' + item.id"
  >
    <!-- Color Indicator (Border visual) -->
    <div class="absolute top-0 inset-x-0 h-1" :style="{ backgroundColor: getValidColor(item.primary_color) }"></div>

    <!-- Card Body -->
    <div class="p-5 flex-1 flex flex-col items-center text-center">
      <!-- Emoji Hero -->
      <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
        <span class="text-5xl filter drop-shadow-md cursor-default">{{ item.emoji || '👔' }}</span>
      </div>

      <!-- Title & Subtitle -->
      <h3 class="font-serif text-base font-medium text-slate-900 mb-1 leading-tight">
        {{ item.subtype }}
      </h3>
      <p class="text-[10px] uppercase tracking-wide text-slate-400 font-medium mb-3">
        {{ item.primary_color }} • {{ item.type }}
      </p>

      <!-- Badges -->
      <div class="flex flex-wrap justify-center gap-1 mb-3">
        <span class="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-medium tracking-wide uppercase border border-slate-200">
          {{ item.season }}
        </span>
      </div>
    </div>

    <!-- Actions / Footer -->
    <div class="px-4 pb-4 pt-0 w-full mt-auto flex justify-between items-center z-10">
      <div class="flex items-center gap-1 text-[10px] text-slate-400" title="Formality Score">
        <span>⚖️</span> 
        <span>{{ item.formality }}/10</span>
      </div>

      <!-- Play Button -->
      <button 
        v-if="item.timestamp_seconds !== undefined"
        @click.stop="$emit('play-video', item.timestamp_seconds)"
        class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600 focus:opacity-100"
        title="Show in video"
      >
        <svg class="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWardrobeStore } from '../stores/wardrobe'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['play-video'])

const store = useWardrobeStore()

const isHighlighted = computed(() => {
    return store.highlightedItems.includes(props.item.id)
})

const getValidColor = (colorName) => {
    if (!colorName) return '#e2e8f0';
    const hexMatch = colorName.match(/#[0-9a-fA-F]{3,6}/);
    if (hexMatch) return hexMatch[0];
    return colorName;
}
</script>
