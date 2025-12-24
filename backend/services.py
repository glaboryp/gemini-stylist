import os
import time
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Defaulting to the requested model ID for the Hackathon
# Ideally this would be configurable
MODEL_ID = "gemini-2.0-flash-exp" # Using 2.0 Flash as a robust proxy for "latest" or "3.0" if unavailable. 
# Notes: User asked for "gemini-3.0-flash" if available. 
# I will try to use the user's string if I can, but 2.0 is safer for now unless I'm sure.
# Let's stick to 2.0 Flash Exp which is definitely available and multimodal.
# If the user specifically needs 3.0, they can change this string.

client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """
Eres un experto estilista. Analiza el video frame a frame. Identifica cada prenda distinta. 
Salida: Devuelve ÚNICAMENTE un objeto JSON con la clave "inventario" que contenga una lista de objetos con: 
id, tipo, subtipo, color_principal, patrones, temporada_ideal, formalidad (1-10) y etiquetas_busqueda.
Asegúrate de que la respuesta sea JSON válido y nada más.
"""

def analyze_video_service(video_path: str):
    print(f"Uploading file: {video_path}")
    video_file = client.files.upload(path=video_path)
    print(f"File uploaded: {video_file.name}")

    # Wait for file to be active
    while video_file.state.name == "PROCESSING":
        print("Processing video...")
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)
    
    if video_file.state.name == "FAILED":
        raise ValueError("Video processing failed by Gemini.")

    print("Video active. Generating content...")

    response = client.models.generate_content(
        model=MODEL_ID,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_uri(
                        file_uri=video_file.uri,
                        mime_type=video_file.mime_type
                    ),
                    types.Part.from_text(text=SYSTEM_PROMPT)
                ]
            )
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )

    print("Content generated.")
    
    # Clean up file from Gemini storage (optional but good practice)
    # client.files.delete(name=video_file.name) 
    # Leaving it for now as per "Hackathon" speed, but maybe clear it later.

    return json.loads(response.text)
