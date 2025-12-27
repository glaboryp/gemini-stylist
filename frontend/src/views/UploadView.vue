<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      <!-- Background subtle elements -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="max-w-2xl w-full space-y-12 relative z-10 transition-all duration-1000 ease-out transform translate-y-0 opacity-100">
          <div class="text-center space-y-4">
               <h2 class="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 tracking-tight leading-tight drop-shadow-sm">
                  Your Personal<br>AI Stylist
               </h2>
               <p class="text-lg md:text-xl text-indigo-200 font-light tracking-wide max-w-lg mx-auto font-sans">
                   Unlock your wardrobe's potential with Gemini 3. Upload a video to get started.
               </p>
          </div>

          <!-- Glassmorphism Drop Zone -->
          <div
              class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/50 hover:bg-white/10 cursor-pointer shadow-2xl"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
          >
               <div class="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               <div class="relative py-16 px-6 text-center space-y-6">
                    <div class="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shadow-lg border border-white/5 group-hover:scale-110 transition-transform duration-300">
                         <svg class="w-8 h-8 text-indigo-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="font-medium text-white group-hover:text-indigo-300 transition-colors">
                             <span class="text-2xl font-serif block mb-1">Upload Video</span>
                             <span class="text-sm font-sans text-slate-400 font-normal">or drag and drop</span>
                             <!-- Input hidden, triggered by wrapper click -->
                             <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                class="sr-only" 
                                accept="video/*" 
                                @click.stop 
                                @change="handleFileSelect" 
                                ref="fileInput"
                             >
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 uppercase tracking-widest">MP4, MOV up to 50MB</p>
               </div>
          </div>

          <div v-if="selectedFile" class="transition-all duration-500 p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/30 backdrop-blur-md flex items-center justify-between shadow-lg">
             <div class="flex items-center gap-3">
                 <div class="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
                 <span class="text-indigo-100 text-sm truncate font-medium max-w-[200px]">{{ selectedFile.name }}</span>
             </div>
             <button 
                @click.stop="analyzeVideo" 
                class="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-400/20"
                :disabled="store.loading"
             >
                 {{ store.loading ? store.loadingMessage || 'Analyzing...' : 'Analyze Wardrobe' }}
             </button>
          </div>

          <div class="space-y-6 pt-4">
               <div class="flex items-center gap-4">
                   <div class="h-px flex-1 bg-linear-to-r from-transparent via-slate-700 to-transparent"></div>
                   <span class="text-xs text-slate-600 font-medium uppercase tracking-widest">For Judges</span>
                   <div class="h-px flex-1 bg-linear-to-r from-transparent via-slate-700 to-transparent"></div>
               </div>

               <button
                  @click="startDemo"
                  class="w-full relative group overflow-hidden rounded-xl bg-linear-to-r from-amber-400 via-orange-500 to-amber-600 p-5 text-center shadow-lg shadow-amber-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-amber-500/40 border border-white/10"
               >
                  <div class="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span class="relative text-white font-bold tracking-wide text-lg text-shadow flex items-center justify-center gap-3 font-serif">
                       ✨ Try Judge Demo Mode
                  </span>
               </button>
          </div>
      </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'

const router = useRouter()
const store = useWardrobeStore()
const fileInput = ref(null)
const selectedFile = ref(null)

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  if (event.target.files.length > 0) {
    selectedFile.value = event.target.files[0]
  }
}

const handleDrop = (event) => {
  if (event.dataTransfer.files.length > 0) {
    selectedFile.value = event.dataTransfer.files[0]
  }
}

const startDemo = () => {
  store.loadDemoData()
  router.push('/wardrobe')
}

const analyzeVideo = async () => {
    if (!selectedFile.value) return;
    await store.analyzeVideo(selectedFile.value);
    if (!store.error) {
        router.push('/wardrobe');
    }
}
</script>
