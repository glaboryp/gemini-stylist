<template>
  <div class="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 w-40 shrink-0">
    <!-- Image/Icon Area -->
    <!-- Image/Icon Area -->
    <div class="h-24 bg-slate-50 flex items-center justify-center relative overflow-hidden group">
      <div class="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-transparent"></div>
      
      <!-- Clearbit Logo / Fallback -->
      <img 
        :src="logoUrl" 
        @error="handleImageError"
        alt="Store Icon" 
        class="w-12 h-12 object-contain p-1.5 bg-white rounded-full shadow-sm z-10 transition-transform duration-300 group-hover:scale-110"
      />
    </div>

    <!-- Content -->
    <div class="p-3 flex flex-col flex-1">
      <h4 class="text-xs font-bold text-slate-800 line-clamp-2 mb-1 leading-tight min-h-[2.5em]" :title="source.title">
        {{ source.title }}
      </h4>
      <p class="text-[10px] text-slate-400 mb-3 truncate">
        {{ displayedHostname }}
      </p>

      <a 
        :href="source.uri" 
        target="_blank" 
        class="mt-auto w-full text-center py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white text-[10px] font-bold uppercase tracking-wide transition-all duration-200"
      >
        Buy Now
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  source: {
    type: Object,
    required: true
  }
})

const getDomain = (uri, title = '') => {
    try {
        const url = new URL(uri);
        let hostname = url.hostname.replace('www.', '');
        
        // Detect if hostname is a google proxy or cloud url
        // The screenshot showed "vertexaisearch.cloud.google.com"
        if (hostname.includes('google') || hostname.includes('vertexai')) {
             // Try to see if the title looks like a domain (e.g. "hm.com", "zara.com")
             if (title && title.includes('.') && !title.includes(' ')) {
                 return title.trim().replace('www.', '');
             }
             // If title is not a domain, try to parse query params? 
             // Often proxies have ?url=... but for now let's rely on the title fix observed in screenshot
        }
        
        return hostname;
    } catch (e) {
        // Fallback: if URI fails to parse, maybe the title itself is the domain?
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
        // Strategy 1: Clearbit Logo API
        return `https://logo.clearbit.com/${domain}`;
    } else if (errorCount.value === 1) {
        // Strategy 2: Google Favicon (high res)
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } else {
        // Fallback or empty
        return ''; 
    }
})

const handleImageError = (e) => {
    if (errorCount.value < 2) {
        errorCount.value++;
    } else {
        // Strategy 3: Render generic emoji icon manually if img fails completely
        e.target.style.display = 'none';
        
        // Create fallback element if not exists
        if (!e.target.parentElement.querySelector('.fallback-icon')) {
            const fallback = document.createElement('div');
            fallback.className = 'fallback-icon text-2xl z-10';
            fallback.innerHTML = '🛍️';
            e.target.parentElement.appendChild(fallback);
        }
    }
}

const displayedHostname = computed(() => {
    return getDomain(props.source.uri, props.source.title);
})
</script>
