<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Gemini Stylist</h2>
        <p class="mt-2 text-sm text-gray-600">Sube un video de tu armario o prueba la demo.</p>
      </div>
      
      <!-- Drag & Drop Area -->
      <div 
        class="mt-8 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors cursor-pointer"
        @dragover.prevent
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <div class="space-y-1 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex text-sm text-gray-600">
            <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <span>Sube un video</span>
              <input id="file-upload" name="file-upload" type="file" class="sr-only" accept="video/*" @change="handleFileSelect" ref="fileInput">
            </label>
            <p class="pl-1">o arrastra y suelta</p>
          </div>
          <p class="text-xs text-gray-500">MP4, MOV hasta 50MB</p>
        </div>
      </div>

      <div v-if="selectedFile" class="text-sm text-gray-700 bg-gray-100 p-2 rounded">
        Seleccionado: {{ selectedFile.name }}
        <button @click.stop="analyzeVideo" class="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {{ store.loading ? 'Analizando...' : 'Analizar Armario' }}
        </button>
      </div>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">O para los jueces</span>
        </div>
      </div>

      <div>
        <button 
          @click="startDemo"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Probar Demo (Jueces)
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
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
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
