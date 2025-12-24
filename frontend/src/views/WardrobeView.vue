<template>
  <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row">
    <!-- Main Content: Wardrobe Grid -->
    <main class="flex-1 p-6 overflow-y-auto h-screen">
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Tu Armario Digital</h1>
        <button @click="$router.push('/')" class="text-indigo-600 hover:text-indigo-800">Volver</button>
      </div>
      
      <div v-if="store.inventory.length === 0" class="text-center py-20 text-gray-500">
        No hay prendas cargadas.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="item in store.inventory" :key="item.id" class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
          <div class="h-48 bg-gray-200 flex items-center justify-center">
             <!-- Placeholder for image since we don't have cropped images yet -->
             <span class="text-4xl">👕</span>
          </div>
          <div class="p-4">
            <h3 class="text-lg font-medium text-gray-900">{{ item.subtipo }} {{ item.color_principal }}</h3>
            <p class="text-sm text-gray-500">{{ item.temporada_ideal }} • {{ item.patrones }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
                <span v-for="tag in item.etiquetas_busqueda" :key="tag" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    {{ tag }}
                </span>
            </div>
            <div class="mt-2 text-xs text-gray-400">
                Formalidad: {{ item.formalidad }}/10
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Sidebar: Chat -->
    <aside class="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
      <div class="p-4 border-b border-gray-200 bg-indigo-600 text-white">
        <h2 class="text-lg font-semibold">Gemini Stylist Chat</h2>
        <p class="text-xs opacity-80">Pídeme un outfit para una ocasión.</p>
      </div>
      
      <div class="flex-1 p-4 overflow-y-auto space-y-4" id="chat-container">
        <div v-for="(msg, index) in store.messages" :key="index" :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          <div :class="['max-w-xs rounded-lg px-4 py-2 text-sm', msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900']">
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input 
            v-model="newMessage" 
            type="text" 
            placeholder="Ej: Outfit para una cena..." 
            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          >
          <button type="submit" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Enviar
          </button>
        </form>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWardrobeStore } from '../stores/wardrobe'

const store = useWardrobeStore()
const newMessage = ref('')

const sendMessage = async () => {
    if (!newMessage.value.trim()) return;
    await store.sendMessage(newMessage.value);
    newMessage.value = '';
}
</script>
