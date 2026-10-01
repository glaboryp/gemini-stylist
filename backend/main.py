import logging
import shutil
import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from services import analyze_video_service, chat_with_stylist_service
from pydantic import BaseModel
from typing import List, Optional, Any

logger = logging.getLogger(__name__)

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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://gen-lang-client-0238866347.web.app", # Firebase Origin
    "https://gemini-stylist-demo.web.app", # New Firebase Demo Origin
]
origins += [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

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
async def analyze_video(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None)
):
    suffix = os.path.splitext(os.path.basename(file.filename or ""))[1]
    temp_file_path = os.path.join("temp_uploads", f"{uuid.uuid4().hex}{suffix}")
    
    # Save uploaded file
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Call Gemini Service
        result = analyze_video_service(temp_file_path, lat, lon)
        return result
    except Exception:
        logger.exception("Video analysis failed")
        raise HTTPException(status_code=500, detail="Video analysis failed")
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[dict]
    inventory_context: List[dict]
    lat: Optional[float] = None
    lon: Optional[float] = None

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = chat_with_stylist_service(
            user_message=request.user_message,
            chat_history=request.chat_history,
            inventory_context=request.inventory_context,
            lat=request.lat,
            lon=request.lon
        )
        return response
    except Exception:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail="Chat failed")
