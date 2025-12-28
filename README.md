# <img src="frontend/public/logo_bgremove.png" alt="Gemini Stylist Logo" height="60" align="middle" /> Gemini Stylist

Gemini Stylist is an AI-powered personal stylist application that scans your wardrobe from a video and acts as your fashion companion. It utilizes **Gemini 3** multimodal capabilities to build a digital inventory and offers hyper-personalized outfit advice grounded in real-world trends and weather data.

## ✨ New Features & Capabilities

- **🕵️‍♀️ Style Persona Diagnosis**: Automatically analyzes your "vibe" (e.g., _Minimalist_, _Boho_, _Y2K_) and dominant color palette upon video upload, acting as a virtual Vogue editor.
- **🌥️ Weather-Adaptive AI**: Uses your geolocation (Open-Meteo API) to recommend outfits suited for your local weather (temperature, rain, etc.) in real-time.
- **📱 Fully Responsive Mobile UI**: Seamless experience on all devices with a mobile-first design, including a smooth slide-over chat interface for phones.
- **💾 Smart Persistence**: Your wardrobe and location data actomatically save to local storage, so you never lose your items after a refresh.
- **🧠 Contextual Suggestions**: "Smart Chips" offer quick starters like _"Outfit for today (Rainy, 12°C)"_ based on context.
- **🔍 Google Search Grounding**: The AI verifies fashion trends 2024/2025 in real-time to ensure advice is current.
- **🛍️ Shopping Integration**: Displays visual shopping cards with logos for recommended new items.

## Project Structure

- `backend/`: FastAPI application handling video uploads and Gemini API integration.
- `frontend/`: Vue 3 application providing the user interface.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API Key

### Backend Setup

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Create a virtual environment:

    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment:

    - **Linux/macOS**:
      ```bash
      source venv/bin/activate
      ```
    - **Windows**:
      ```bash
      venv\Scripts\activate
      ```

4.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

5.  Configure Environment Variables:

    - Create a `.env` file in the `backend/` directory.
    - Add your Gemini API key:
      ```
      GEMINI_API_KEY=your_api_key_here
      ```

6.  Run the development server:
    ```bash
    fastapi dev main.py
    ```
    The backend runs at `http://127.0.0.1:8000`.

### Frontend Setup

1.  Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Run the development server:
    ```bash
    pnpm run dev
    ```
    The frontend runs at `http://localhost:5173`.

## Usage

1.  Ensure both backend and frontend servers are running.
2.  Open your browser and go to `http://localhost:5173`.
3.  Upload a video of your clothes or try the **Demo Mode** to see it in action.
