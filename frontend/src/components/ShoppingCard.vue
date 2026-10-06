<template>
  <div class="flex w-44 shrink-0 flex-col border border-line bg-surface transition-colors duration-200 hover:border-ink">
    <div class="flex h-20 items-center justify-center border-b border-line bg-paper">
      <img
        v-if="!logoFailed"
        :src="logoUrl"
        alt=""
        class="h-10 w-10 object-contain"
        @error="handleImageError"
      />
      <PhShoppingBag v-else :size="32" aria-hidden="true" data-testid="logo-fallback" />
    </div>

    <div class="flex flex-1 flex-col p-3">
      <h4 class="mb-1 min-h-[2.5em] text-sm font-medium leading-tight line-clamp-2" :title="source.title">
        {{ source.title }}
      </h4>
      <p class="mb-3 truncate font-mono text-xs text-ink-soft">
        {{ displayedHostname }}
      </p>

      <a
        :href="source.uri"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-auto flex h-11 w-full items-center justify-center border border-ink text-sm font-medium transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px"
      >
        View at store
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PhShoppingBag } from '@phosphor-icons/vue'

const props = defineProps({
  source: {
    type: Object,
    required: true
  }
})

const errorCount = ref(0)
const logoFailed = ref(false)

const getDomain = (uri, title = '') => {
    try {
        const url = new URL(uri);
        let hostname = url.hostname.replace('www.', '');

        if (hostname.includes('google') || hostname.includes('vertexai')) {
             if (title && title.includes('.') && !title.includes(' ')) {
                 return title.trim().replace('www.', '');
             }
        }

        return hostname;
    } catch (e) {
        if (title && title.includes('.') && !title.includes(' ')) {
             return title.trim();
        }
        return '';
    }
}

const logoUrl = computed(() => {
    const domain = getDomain(props.source.uri, props.source.title);
    if (!domain) return '';

    if (errorCount.value === 0) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } else if (errorCount.value === 1) {
        return `https://logo.clearbit.com/${domain}`;
    } else {
        return '';
    }
})

const handleImageError = () => {
    if (errorCount.value < 2) {
        errorCount.value++;
    } else {
        logoFailed.value = true;
    }
}

const displayedHostname = computed(() => {
    return getDomain(props.source.uri, props.source.title);
})
</script>
