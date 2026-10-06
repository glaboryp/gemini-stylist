<template>
  <article
    :id="'item-' + item.id"
    :data-highlighted="isHighlighted"
    class="group relative flex flex-col border bg-surface transition-colors duration-200"
    :class="isHighlighted ? 'z-10 border-accent ring-2 ring-accent' : 'border-line'"
  >
    <div
      data-testid="swatch"
      class="relative h-28 border-b border-line [clip-path:polygon(20px_0,100%_0,100%_100%,0_100%,0_20px)] sm:h-36"
      :style="{ backgroundColor: getValidColor(item.primary_color) }"
    >
      <button
        v-if="item.timestamp_seconds !== undefined"
        type="button"
        class="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center bg-paper text-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px"
        title="Show in video"
        aria-label="Show in video"
        @click.stop="$emit('play-video', item.timestamp_seconds)"
      >
        <PhPlay :size="18" weight="fill" aria-hidden="true" />
      </button>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-3">
      <div>
        <h3 class="font-display text-lg font-semibold leading-tight">{{ item.subtype }}</h3>
        <p class="mt-0.5 text-sm text-ink-soft">{{ getColorName(item.primary_color) }}</p>
      </div>

      <dl class="mt-auto space-y-1 border-t border-line pt-2 font-mono text-xs">
        <div class="flex justify-between gap-3">
          <dt class="text-ink-soft">Type</dt>
          <dd class="text-right">{{ item.type }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-ink-soft">Season</dt>
          <dd class="text-right">{{ item.season }}</dd>
        </div>
        <div class="flex justify-between gap-3" title="Formality score">
          <dt class="text-ink-soft">Formality</dt>
          <dd>{{ item.formality }}/10</dd>
        </div>
      </dl>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { PhPlay } from '@phosphor-icons/vue'
import { useWardrobeStore } from '../stores/wardrobe'
import { getValidColor, getColorName } from '../utils/color'

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
</script>
