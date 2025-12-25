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
        content: 'Demo Mode activated. I have analyzed your simulated wardrobe. What do you need today?'
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

        if (response.data && response.data.inventory) {
          this.inventory = response.data.inventory;
          this.messages.push({
            role: 'system',
            content: 'Video analysis complete. I have detected your clothing items.'
          });
        }
      } catch (err) {
        console.error(err);
        this.error = "Error analyzing video.";
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(text) {
        // Mock chat response for now, or call another endpoint if implemented
        this.messages.push({ role: 'user', content: text });
        
        // Simple heuristic response
        setTimeout(() => {
            const response = "Got it! Based on your wardrobe, I suggest pairing the top with something neutral.";
            this.messages.push({ role: 'system', content: response });
        }, 1000);
    }
  }
})
