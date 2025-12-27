import shutil
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from services import analyze_video_service, chat_with_stylist_service
from pydantic import BaseModel
from typing import List, Optional, Any

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create temp directory if not exists
    os.makedirs("temp_uploads", exist_ok=True)
    yield
    # Shutdown: Clean up or keep
    shutil.rmtree("temp_uploads", ignore_errors=True)

app = FastAPI(lifespan=lifespan)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vue frontend default
    "http://127.0.0.1:5173",
    "*" # For hackathon demo ease
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Gemini Stylist Backend API"}

@app.post("/analyze-video")
async def analyze_video(file: UploadFile = File(...)):
    temp_file_path = f"temp_uploads/{file.filename}"
    
    # Save uploaded file
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Call Gemini Service
        result = analyze_video_service(temp_file_path)
        print(f"Service Result: {result}")
        return result
    except Exception as e:
        print(f"Service Error: {e}")
        return {"error": str(e)}
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[dict]
    inventory_context: List[dict]

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = chat_with_stylist_service(
            user_message=request.user_message,
            chat_history=request.chat_history,
            inventory_context=request.inventory_context
        )
        return response
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"error": str(e)}
