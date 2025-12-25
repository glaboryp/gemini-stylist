# Gemini Stylist

Gemini Stylist is an AI-powered personal stylist application that organizes your wardrobe and offers outfit suggestions. It utilizes the Gemini 3 multimodal capabilities to analyze videos of your clothing, identifying items, colors, patterns, and more to build a digital inventory.

## Features

- **Video Analysis**: Upload a video of your wardrobe, and Gemini 3 will automatically detect and catalog your clothes.
- **Digital Closet**: View your organized inventory with details like type, color, season, and formality.
- **AI Stylist Chat**: Chat with an AI assistant that knows your wardrobe and can suggest outfits for specific occasions.
- **Demo Mode**: Quickly explore the app's features with pre-loaded mock data.

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
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The frontend runs at `http://localhost:5173`.

## Usage

1.  Ensure both backend and frontend servers are running.
2.  Open your browser and go to `http://localhost:5173`.
3.  Upload a video of your clothes or try the **Demo Mode** to see it in action.
