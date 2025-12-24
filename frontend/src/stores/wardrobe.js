import { defineStore } from 'pinia'
import axios from 'axios'
import { mockInventory } from '../data/mock'

export const useWardrobeStore = defineStore('wardrobe', {
  state: () => ({
    inventory: [],
    loading: false,
    error: null,
    messages: []
  }),
  actions: {
    loadDemoData() {
      this.inventory = mockInventory;
      this.messages.push({
        role: 'system',
        content: 'Modo Demo activado. He analizado tu armario simulado. ¿Qué necesitas hoy?'
      });
    },
    async analyzeVideo(file) {
      this.loading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Point to backend URL
        const response = await axios.post('http://localhost:8000/analyze-video', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data && response.data.inventario) {
          this.inventory = response.data.inventario;
          this.messages.push({
            role: 'system',
            content: 'Análisis de video completado. He detectado tus prendas.'
          });
        }
      } catch (err) {
        console.error(err);
        this.error = "Error al analizar el video.";
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(text) {
        // Mock chat response for now, or call another endpoint if implemented
        this.messages.push({ role: 'user', content: text });
        
        // Simple heuristic response
        setTimeout(() => {
            const response = "¡Entendido! Basado en tu armario, te sugiero combinar la prenda superior con algo neutro.";
            this.messages.push({ role: 'system', content: response });
        }, 1000);
    }
  }
})
