import { defineStore } from 'pinia'
import axios from 'axios'
import { mockInventory } from '../data/mock'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useWardrobeStore = defineStore('wardrobe', {
  state: () => ({
    inventory: [],
    loading: false,
    loadingMessage: "Analyzing...",
    error: null,
    messages: [],
    videoUrl: null,
    highlightedItems: [],
    userLocation: { lat: null, lon: null },
    weather: null // { temp: number, description: string, code: number }
  }),
  actions: {
    // Persistence Helper
    saveState() {
        localStorage.setItem('gemini_wardrobe_inventory', JSON.stringify(this.inventory));
        localStorage.setItem('gemini_wardrobe_location', JSON.stringify(this.userLocation));
    },
    loadState() {
        const storedInventory = localStorage.getItem('gemini_wardrobe_inventory');
        if (storedInventory) this.inventory = JSON.parse(storedInventory);
        
        const storedLocation = localStorage.getItem('gemini_wardrobe_location');
        if (storedLocation) this.userLocation = JSON.parse(storedLocation);
    },
    
    loadDemoData() {
      // Use the verified, rich mock data directly
      this.inventory = mockInventory;
      this.videoUrl = null; // No video in demo mode
      this.messages.push({
        role: 'model',
        content: 'Demo Mode activated. I see your simulated wardrobe. Ask me for an outfit!'
      });
      this.saveState();
    },
    
    clearWardrobe() {
        this.inventory = [];
        this.messages = [];
        this.videoUrl = null;
        this.userLocation = { lat: null, lon: null };
        this.weather = null;
        this.error = null;
        localStorage.removeItem('gemini_wardrobe_inventory');
        localStorage.removeItem('gemini_wardrobe_location');
    },

    async fetchWeather() {
        if (!this.userLocation.lat || !this.userLocation.lon) return;
        
        try {
            const { lat, lon } = this.userLocation;
            // Simple client-side fetch for UI display
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.current) {
                this.weather = {
                    temp: data.current.temperature_2m,
                    code: data.current.weather_code,
                    // Simple mapping for UI icon/text
                    description: this.getWeatherDescription(data.current.weather_code)
                };
            }
        } catch (e) {
            console.error("Failed to fetch weather for UI", e);
        }
    },
    
    getWeatherDescription(code) {
        if (code === 0) return "Clear";
        if (code >= 1 && code <= 3) return "Cloudy";
        if (code >= 45 && code <= 48) return "Foggy";
        if (code >= 51 && code <= 67) return "Rainy";
        if (code >= 71 && code <= 77) return "Snowy";
        if (code >= 80 && code <= 82) return "Showers";
        if (code >= 95) return "Thunderstorm";
        return "Unknown";
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
      
      // We will handle progress text in the view now
      this.loadingMessage = "Preparing video...";


      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add location for Style Persona
        if (this.userLocation.lat && this.userLocation.lon) {
            formData.append('lat', this.userLocation.lat);
            formData.append('lon', this.userLocation.lon);
        }

        // Point to backend URL
        const response = await axios.post(`${API_URL}/analyze-video`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data && response.data.inventory) {
          // APPEND Logic with Unique IDs
          const timestamp = Date.now();
          const newItems = response.data.inventory.map((item, index) => ({
              ...item,
              id: `${timestamp}_${index}_${Math.random().toString(36).substr(2, 5)}` // Robust Unique ID
          }));
          
          this.inventory.push(...newItems);
          this.saveState();
          
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
        console.error(err);
        this.error = "Error analyzing video. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    highlightItems(ids) {
      this.highlightedItems = ids || [];
    },
    getUserLocation() {
        // Optimization: Use stored location if available
        if (this.userLocation.lat && this.userLocation.lon) {
            this.fetchWeather();
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    console.log("Location access granted");
                    this.saveState();
                    this.fetchWeather();
                },
                (error) => {
                    console.log("Location access denied or error:", error.message);
                    // Fail silently as per requirements
                }
            );
        }
    },
    async sendMessage(text) {
        // Optimistic UI update
        this.messages.push({ role: 'user', content: text });
        // Clear previous highlights
        this.highlightedItems = [];
        
        try {
            const payload = {
                user_message: text,
                chat_history: this.messages.slice(0, -1), // Send history excluding the new message
                inventory_context: this.inventory,
                lat: this.userLocation.lat,
                lon: this.userLocation.lon
            };
            
            const response = await axios.post(`${API_URL}/api/chat`, payload);
            
            if (response.data) {
                // Determine text content
                const content = response.data.text || "I'm not sure what to say.";
                
                this.messages.push({ 
                     role: 'model', 
                     content: content,
                     sources: response.data.sources // Store sources if we want to display them later
                 });

                 // Handle highlights
                 if (response.data.related_item_ids && Array.isArray(response.data.related_item_ids)) {
                     this.highlightItems(response.data.related_item_ids);
                 }
            }
        } catch (err) {
             console.error("Chat error", err);
             this.messages.push({ role: 'model', content: "Sorry, I'm having trouble connecting to the stylist brain right now." });
        }
    }
  }
})
