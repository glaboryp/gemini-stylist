import os
import time
import json
import re
import random
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, InternalServerError

load_dotenv()

keys_string = os.environ.get("GOOGLE_API_KEYS", "")
API_KEYS_POOL = [k.strip() for k in keys_string.split() if k.strip()]

if not API_KEYS_POOL:
    single_key = os.environ.get("GOOGLE_API_KEY")
    if single_key:
        API_KEYS_POOL = [single_key]
    else:
        print("❌ ADVERTENCIA: No se encontraron API KEYS.")
        API_KEYS_POOL = []

FALLBACK_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemma-3-27b-it",
    "gemma-3-12b-it"
]

VIDEO_MODEL_ID = "gemini-3-flash"

def get_random_client():
    if not API_KEYS_POOL:
        raise ValueError("No hay API Keys disponibles.")
    
    selected_key = random.choice(API_KEYS_POOL)
    return genai.Client(api_key=selected_key)

SYSTEM_PROMPT = """
You are an expert fashion stylist and inventory manager with perfect computer vision.
Your task is to analyze the provided video frame by frame to create a structured inventory of the clothing that appears.

Analysis Instructions:
1. Identify each distinct clothing item separately. Ignore non-clothing objects.
2. If an item is partially visible, infer the rest based on fashion logic.
3. For each detected item, extract: id, type, subtype, primary_color, patterns, season, formality, search_tags, emoji.

Output:
Return ONLY a valid JSON object with the following structure:
{
  "inventory": [ { ... item data ... } ],
  "suggestion_starter": "A short observation about the style.",
  "welcome_message": "A friendly welcome message."
}
"""

def clean_and_parse_json(response_text):
    try:
        match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            match = re.search(r"(\{.*\})", response_text, re.DOTALL)
            json_str = match.group(1) if match else response_text

        return json.loads(json_str)
    except (json.JSONDecodeError, AttributeError):
        return {"text": response_text, "related_item_ids": []}

def get_current_weather(lat: float, lon: float):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&timezone=auto"
        response = requests.get(url, timeout=3)
        data = response.json()
        
        if "current" in data:
            temp = data["current"]["temperature_2m"]
            code = data["current"]["weather_code"]
            
            condition = "Unknown"
            if code == 0: condition = "Clear sky"
            elif code in [1, 2, 3]: condition = "Cloudy"
            elif code in [45, 48]: condition = "Foggy"
            elif code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: condition = "Rainy"
            elif code in [71, 73, 75, 77, 85, 86]: condition = "Snowy"
            elif code in [95, 96, 99]: condition = "Thunderstorm"
            
            return f"{condition}, {temp}°C"
    except Exception as e:
        print(f"Weather warning: {e}")
    return None


def generate_style_persona(inventory: list, lat: float = None, lon: float = None):
    weather_context = ""
    if lat and lon:
        w_info = get_current_weather(lat, lon)
        if w_info: weather_context = f"User Location Weather: {w_info}."

    inventory_json = json.dumps(inventory, indent=2)

    prompt = f"""
    You are a Senior Fashion Editor for Vogue or GQ. The user has this wardrobe:
    {inventory_json}
    {weather_context}
    
    YOUR TASK: Create a "Style Persona Diagnosis".
    1. Coherence Analysis (Vibe).
    2. Color Palette.
    3. Trend Spotting (Connect to 2024/2025 trends).
    
    OUTPUT FORMAT (Strict JSON):
    {{
      "text": "Markdown formatted analysis with emojis and bold text.",
      "related_item_ids": ["id1", "id2"]
    }}
    """

    last_error = None
    
    for model_name in FALLBACK_MODELS:
        try:
            client = get_random_client()
            google_search_tool = types.Tool(google_search=types.GoogleSearch())
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[google_search_tool],
                    response_mime_type="application/json"
                )
            )
            return clean_and_parse_json(response.text)

        except Exception as e:
            last_error = e
            continue
            
    print(f"❌ All Persona models failed. Last error: {last_error}")
    return None

def analyze_video_service(video_path: str, lat: float = None, lon: float = None):
    """Sube y analiza el video. (Sin fallback complejo por ser subida de archivo)."""
    print(f"Uploading file: {video_path}")
    
    client = get_random_client()

    try:
        video_file = client.files.upload(file=video_path)
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise e

    while video_file.state.name == "PROCESSING":
        print("Processing video...")
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)
    
    if video_file.state.name == "FAILED":
        raise ValueError("Video processing failed by Gemini.")

    print("Video active. Generating inventory...")

    response = client.models.generate_content(
        model=VIDEO_MODEL_ID,
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
        config=types.GenerateContentConfig(response_mime_type="application/json")
    )

    initial_result = json.loads(response.text)
    
    if "inventory" in initial_result:
        print("Generating Stylist Persona...")
        persona = generate_style_persona(initial_result["inventory"], lat, lon)
        if persona and "text" in persona:
            initial_result["welcome_message"] = persona["text"]
    
    return initial_result

def chat_with_stylist_service(user_message: str, chat_history: list, inventory_context: list, lat: float = None, lon: float = None):
    weather_context = ""
    if lat and lon:
        w_info = get_current_weather(lat, lon)
        if w_info: weather_context = f"User Location Weather: {w_info}"

    inventory_json = json.dumps(inventory_context, indent=2)
    
    system_instruction = f"""
    You are a personal stylist using this wardrobe: {inventory_json}
    {weather_context}
    INSTRUCTIONS:
    1. Create outfits from inventory.
    2. Adapt to weather if provided.
    3. Use Search Tool for new items.
    OUTPUT JSON: {{"text": "...", "related_item_ids": [...]}}
    """

    contents = []
    for msg in chat_history:
        role = "user" if msg.get("role") == "user" else "model"
        if msg.get("content"):
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
            
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    last_error = None

    for model_name in FALLBACK_MODELS:
        try:
            client = get_random_client()
            google_search_tool = types.Tool(google_search=types.GoogleSearch())
            
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    tools=[google_search_tool],
                    system_instruction=system_instruction
                )
            )

            sources = []
            if response.candidates and response.candidates[0].grounding_metadata:
                metadata = response.candidates[0].grounding_metadata
                if metadata.grounding_chunks:
                    for chunk in metadata.grounding_chunks:
                        if chunk.web:
                            sources.append({"title": chunk.web.title, "uri": chunk.web.uri})

            parsed_response = clean_and_parse_json(response.text)
            
            text_response = parsed_response.get("text")
            if not text_response:
                text_response = response.text if response.text else "Here is what I found."

            return {
                "text": text_response,
                "related_item_ids": parsed_response.get("related_item_ids", []),
                "sources": sources
            }

        except Exception as e:
            last_error = e
            continue

    print(f"❌ All Chat models failed. Last error: {last_error}")
    return {
        "text": "I'm currently overwhelmed with fashion requests (High Traffic). Please try again in a moment.",
        "sources": []
    }