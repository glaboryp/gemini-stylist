import shutil
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from services import analyze_video_service

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
        return result
    except Exception as e:
        return {"error": str(e)}
    finally:
        # Cleanup temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
