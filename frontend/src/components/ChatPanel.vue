<template>
  <aside class="flex flex-col border-l border-slate-100 shadow-2xl bg-white">
    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur h-16 shrink-0">
      <div class="flex items-center gap-3">
        <!-- Mobile Close Button -->
        <button @click="$emit('close')" class="lg:hidden p-1 -ml-2 text-slate-400 hover:text-slate-600">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div class="w-10 h-10 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
          AI
        </div>
        <div>
          <h3 class="font-bold text-slate-800 text-lg leading-tight">Stylist Assistant</h3>
          <div class="flex items-center gap-2">
            <p class="text-[11px] text-green-500 font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
            </p>
            <p v-if="isThinking" class="text-[11px] text-indigo-500 font-medium animate-pulse">
              • Thinking... 👗
            </p>
          </div>
        </div>
      </div>

      <!-- Weather Widget -->
      <div v-if="store.weather" class="flex flex-col items-end">
          <div class="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
              <span class="text-lg">{{ getWeatherEmoji(store.weather.code) }}</span>
              <span class="text-xs font-bold font-mono">{{ Math.round(store.weather.temp) }}°C</span>
          </div>
          <span class="text-[9px] text-slate-400 font-medium pr-1">{{ store.weather.description }}</span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" id="chat-container">
      <div v-if="store.messages.length === 0" class="text-center text-slate-400 text-sm mt-10 p-4">
        <p>Ask me "What should I wear to a dinner?" or "Find me shoes that match this".</p>
      </div>

      <div v-for="(msg, index) in store.messages" :key="index" :class="['flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start']">
        <div 
          :class="[
            'max-w-[85%] rounded-2xl px-5 py-4 text-base leading-relaxed shadow-sm relative group',
            msg.role === 'user' 
              ? 'bg-slate-900 text-white rounded-br-none' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
          ]"
        >
          <div v-html="formatMessage(msg.content)"></div>
          
          <div v-if="msg.sources && msg.sources.length > 0" class="mt-5 pt-4 border-t border-slate-100">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Shopping Sources</span>
                <span class="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[9px] font-bold border border-indigo-100">{{ msg.sources.length }}</span>
            </div>
            
            <!-- Shopping Carousel -->
            <div class="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide snap-x">
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
      
      <div v-if="isThinking" class="flex w-full justify-start">
        <div class="bg-white px-5 py-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1">
          <div class="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></div>
          <div class="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-75"></div>
          <div class="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-150"></div>
        </div>
      </div>
    </div>

    <div class="p-6 bg-white border-t border-slate-100">
      
      <!-- Suggestion Chips -->
      <div v-if="store.messages.filter(m => m.role === 'user').length === 0" class="flex flex-wrap gap-2 mb-4">
        <button 
            v-for="(chip, index) in suggestions" 
            :key="index"
            @click="sendMessage(chip)"
            class="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm cursor-pointer animate-fade-in-up"
            :style="{ animationDelay: `${index * 100}ms` }"
        >
            {{ chip }}
        </button>
      </div>

      <form @submit.prevent="sendMessage" class="relative">
        <input 
          v-model="newMessage" 
          type="text" 
          :placeholder="isThinking ? 'Stylist is thinking...' : 'Ask for outfit advice...'" 
          class="w-full pl-6 pr-14 py-4 rounded-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-base text-slate-800 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isThinking"
        >
        <button 
          type="submit" 
          class="absolute right-2 top-2 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
          :disabled="!newMessage.trim() || isThinking"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </button>
      </form>
      <div class="text-center mt-3 flex justify-center items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
        <p class="text-[11px] text-slate-400">Powered by <strong>Gemini 3</strong> • Google Search Grounded</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { useWardrobeStore } from '../stores/wardrobe'
import ShoppingCard from './ShoppingCard.vue'

const store = useWardrobeStore()
const newMessage = ref('')
const isThinking = ref(false)

// Auto-scroll chat
watch(() => store.messages.length, async () => {
    await nextTick()
    const container = document.getElementById('chat-container')
    if (container) container.scrollTop = container.scrollHeight
})

const sendMessage = async (textInput) => {
    // If textInput is a string (from chip), use it. Otherwise use model value.
    const textToSend = (typeof textInput === 'string') ? textInput : newMessage.value;

    if (!textToSend.trim() || isThinking.value) return;
    
    // Updates UI
    if (typeof textInput !== 'string') newMessage.value = ''; // Only clear input if sent from input
    
    isThinking.value = true;
    
    // Auto-scroll to bottom immediately
    await nextTick()
    const container = document.getElementById('chat-container')
    if (container) container.scrollTop = container.scrollHeight

    await store.sendMessage(textToSend);
    isThinking.value = false;
}

const formatMessage = (content) => {
    if (!content) return '';
    // Format bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-indigo-900">$1</strong>');
    // Format *text* as italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>');
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

const getHostname = (uri) => {
    try {
        return new URL(uri).hostname;
    } catch (e) {
        return uri;
    }
}

const getWeatherEmoji = (code) => {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "☁️";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⚡";
    return "🌡️";
}

const suggestions = computed(() => {
    const list = [
        "💼 Work / Office Look",
        "🎉 Party / Night Out",
        "✨ Casual Weekend"
    ];
    
    // Add weather context if available
    if (store.weather) {
        const temp = Math.round(store.weather.temp);
        const condition = store.weather.description || 'Current Weather';
        list.unshift(`☁️ Outfit for today (${condition}, ${temp}°C)`);
    } else {
        list.unshift("📅 Outfit for today");
    }
    
    return list;
})
</script>
