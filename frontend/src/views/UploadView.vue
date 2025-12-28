<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
    <!-- Background subtle elements -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="max-w-2xl w-full space-y-6 md:space-y-8 relative z-10 transition-all duration-1000 ease-out transform translate-y-0 opacity-100">
      <div class="text-center space-y-2">
        <div class="flex justify-center mb-4 mt-2">
          <img src="/logo_bgremove.png" alt="Gemini Stylist Logo" class="h-20 w-auto drop-shadow-lg" />
        </div>
        <h2 class="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 tracking-tight leading-tight drop-shadow-sm">
          Your Personal<br>AI Stylist
        </h2>
        <p class="text-base md:text-lg text-indigo-200 font-light tracking-wide max-w-lg mx-auto font-sans">
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
          
        <div class="relative py-10 px-6 text-center space-y-4">
          <div class="mx-auto w-14 h-14 rounded-full bg-white/10 flex items-center justify-center shadow-lg border border-white/5 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-7 h-7 text-indigo-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </div>
            
          <div class="space-y-1">
            <div class="font-medium text-white group-hover:text-indigo-300 transition-colors">
              <span class="text-xl font-serif block mb-1">Upload Video</span>
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
          <p class="text-[10px] text-slate-500 uppercase tracking-widest">MP4, MOV up to 50MB</p>
        </div>
      </div>

          <div v-if="selectedFile && !store.loading" class="transition-all duration-500 p-4 rounded-xl bg-indigo-900/30 border border-indigo-500/30 backdrop-blur-md flex items-center justify-between shadow-lg">
             <div class="flex items-center gap-3">
                 <div class="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
                 <span class="text-indigo-100 text-sm truncate font-medium max-w-[200px]">{{ selectedFile.name }}</span>
             </div>
             <button 
                @click.stop="analyzeVideo" 
                class="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 border border-indigo-400/20 cursor-pointer"
             >
                 Analyze Wardrobe
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
          class="w-full relative group overflow-hidden rounded-xl bg-linear-to-r from-amber-400 via-orange-500 to-amber-600 p-5 text-center shadow-lg shadow-amber-500/20 transition-transform duration-300 hover:-translate-y-1 hover:shadow-amber-500/40 border border-white/10 cursor-pointer mb-10"
        >
          <div class="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span class="relative text-white font-bold tracking-wide text-lg text-shadow flex items-center justify-center gap-3 font-serif">
            ✨ Try Judge Demo Mode
          </span>
        </button>
      </div>
    </div>

    <!-- ANALYZING STATE OVERLAY (Moved to root to escape transforms) -->
    <!-- Using Teleport logic by being outside the transformed container -->
    <div v-if="store.loading" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-2xl transition-all duration-700 overflow-hidden">
        
        <!-- Tech/Scanning Grid Overlay -->
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        
        <!-- Video Loop Container -->
        <div class="relative w-64 h-64 md:w-80 md:h-80 mb-10 rounded-full overflow-hidden border-4 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <div class="absolute inset-0 bg-indigo-900/20 z-10 grid-overlay"></div>
        <!-- Scanning Line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-amber-400/80 blur-sm z-20 animate-scan"></div>
        
        <video 
            v-if="videoPreviewUrl"
            :src="videoPreviewUrl" 
            autoplay 
            loop 
            muted 
            playsinline
            class="w-full h-full object-cover opacity-80"
        ></video>
        </div>

        <!-- Status & Progress -->
        <div class="w-full max-w-md px-6 space-y-4 text-center relative z-10">
            <h3 class="text-2xl font-serif text-white font-medium animate-pulse tracking-wide">
            {{ currentStatusMessage }}
            </h3>
            
            <!-- Progress Bar Container -->
            <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
                class="h-full bg-linear-to-r from-amber-300 via-amber-500 to-amber-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                :style="{ width: `${progress}%` }"
            ></div>
            </div>
            <p class="text-xs text-slate-400 font-mono tracking-widest">{{ Math.round(progress) }}% COMPLETE</p>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWardrobeStore } from '../stores/wardrobe'

const router = useRouter()
const store = useWardrobeStore()
const fileInput = ref(null)
const selectedFile = ref(null)

// UX State
const videoPreviewUrl = ref(null)
const progress = ref(0)
const currentStatusMessage = ref("Initializing...")
let progressInterval = null

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  if (event.target.files.length > 0) {
    setFile(event.target.files[0])
  }
}

const handleDrop = (event) => {
  if (event.dataTransfer.files.length > 0) {
    setFile(event.dataTransfer.files[0])
  }
}

const setFile = (file) => {
    selectedFile.value = file
    // Create preview URL
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
    videoPreviewUrl.value = URL.createObjectURL(file)
}

const startFakeProgress = () => {
    progress.value = 0
    currentStatusMessage.value = "Initializing..."
    
    // reset interval if exists
    if (progressInterval) clearInterval(progressInterval)

    // Total fake duration approx 25s to reach 90%
    // 90% / 250 steps (100ms) = 0.36% per step
    progressInterval = setInterval(() => {
        if (progress.value < 90) {
            // Add some randomness to feel real
            const increment = Math.random() * 0.5 + 0.1
            progress.value = Math.min(progress.value + increment, 90)
            
            // Sync Status Messages
            if (progress.value > 15 && progress.value < 40) currentStatusMessage.value = "Detecting fabrics & textures..."
            if (progress.value >= 40 && progress.value < 65) currentStatusMessage.value = "Analyzing color palette..."
            if (progress.value >= 65 && progress.value < 85) currentStatusMessage.value = "Identifying clothing items..."
            if (progress.value >= 85) currentStatusMessage.value = "Generating style embeddings..."
        }
    }, 100)
}

const startDemo = () => {
  store.loadDemoData()
  router.push('/wardrobe')
}

const analyzeVideo = async () => {
    if (!selectedFile.value) return;
    
    startFakeProgress()
    
    try {
        await store.analyzeVideo(selectedFile.value);
        if (!store.error) {
            // Jump to 100% before navigating
            progress.value = 100
            currentStatusMessage.value = "Complete!"
            setTimeout(() => {
                router.push('/wardrobe');
            }, 500)
        }
    } catch (e) {
        clearInterval(progressInterval)
        currentStatusMessage.value = "Error occurred."
    }
}

onUnmounted(() => {
    if (progressInterval) clearInterval(progressInterval)
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
})
</script>

<style scoped>
@keyframes scan {
  0% { top: 0%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.animate-scan {
  animation: scan 3s linear infinite;
}

.grid-overlay {
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>
