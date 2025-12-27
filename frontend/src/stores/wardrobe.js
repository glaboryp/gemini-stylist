import { defineStore } from 'pinia'
import axios from 'axios'
import { mockInventory } from '../data/mock'

export const useWardrobeStore = defineStore('wardrobe', {
  state: () => ({
    inventory: [],
    loading: false,
    loadingMessage: "Analyzing...",
    error: null,
    messages: [],
    videoUrl: null
  }),
  actions: {
    loadDemoData() {
      // Use the verified, rich mock data directly
      this.inventory = mockInventory;
      this.videoUrl = null; // No video in demo mode
      this.messages.push({
        role: 'model',
        content: 'Demo Mode activated. I see your simulated wardrobe. Ask me for an outfit!'
      });
    },
    async analyzeVideo(file) {
      this.loading = true;
      this.error = null;
      this.messages = []; // Clear previous chat
      // Create a local URL for the video file to allow playback
      if (this.videoUrl) URL.revokeObjectURL(this.videoUrl); // Cleanup old
      this.videoUrl = URL.createObjectURL(file);
      
      const loadingMessages = [
        "Detecting fabrics...",
        "Analyzing color palette...",
        "Consulting fashion trends...",
        "Identifying items..."
      ];
      let msgIndex = 0;
      this.loadingMessage = loadingMessages[0];
      
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        this.loadingMessage = loadingMessages[msgIndex];
      }, 2000);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Point to backend URL
        const response = await axios.post('http://localhost:8000/analyze-video', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        clearInterval(interval);

        if (response.data && response.data.inventory) {
          this.inventory = response.data.inventory;
          
          if (response.data.welcome_message) {
            this.messages.push({
                role: 'model',
                content: response.data.welcome_message
            });
          }
           if (response.data.suggestion_starter) {
            this.messages.push({
                role: 'model',
                content: `💡 Hint: ${response.data.suggestion_starter}`
            });
          }
        }
      } catch (err) {
        clearInterval(interval);
        console.error(err);
        this.error = "Error analyzing video. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    async sendMessage(text) {
        // Optimistic UI update
        this.messages.push({ role: 'user', content: text });
        
        try {
            const payload = {
                user_message: text,
                chat_history: this.messages.slice(0, -1), // Send history excluding the new message
                inventory_context: this.inventory
            };
            
            const response = await axios.post('http://localhost:8000/api/chat', payload);
            
            if (response.data && response.data.text) {
                 this.messages.push({ 
                     role: 'model', 
                     content: response.data.text,
                     sources: response.data.sources // Store sources if we want to display them later
                 });
            }
        } catch (err) {
             console.error("Chat error", err);
             this.messages.push({ role: 'model', content: "Sorry, I'm having trouble connecting to the stylist brain right now." });
        }
    }
  }
})
