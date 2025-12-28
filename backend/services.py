import os
import time
import json
import re
from google import genai
from google.genai import types
from dotenv import load_dotenv
import requests

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

MODEL_ID = "gemini-3-flash-preview"

try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing GenAI client: {e}")
    client = None

SYSTEM_PROMPT = """
You are an expert fashion stylist and inventory manager with perfect computer vision.
Your task is to analyze the provided video frame by frame to create a structured inventory of the clothing that appears.

Analysis Instructions:
1. Identify each distinct clothing item separately. Ignore non-clothing objects (furniture, floor).
2. If an item is partially visible, infer the rest based on fashion logic.
3. For each detected item, extract the following data:
   - id: (generate a short identifier, e.g., "item_01")
   - type: (e.g., "Top", "Bottom", "Shoes")
   - subtype: (e.g., "Oxford Shirt", "Chinos", "Running Shoes")
   - primary_color: (approximate hex code and name)
   - patterns: (e.g., "Solid", "Striped", "Plaid")
   - season: (Winter, Summer, Transitional)
   - formality: (1-10, where 10 is black tie)
   - search_tags: (array of strings to facilitate future searches, e.g., ["cotton", "casual", "blue"])
   - emoji: (a single emoji representing the item, e.g., 🧥, 👖, 👟)
   - timestamp_seconds: (integer estimating the second in the video where the item is most clearly visible)

Output:
Return ONLY a valid JSON object with the following structure:
{
  "inventory": [
    { ... item data ... }
  ],
  "suggestion_starter": "A short, 1-sentence observation about the collection's style (e.g., 'I see a lot of earth tones and comfortable fabrics here.').",
  "welcome_message": "A friendly, engaging welcome message (2-3 sentences) introducing yourself as their AI Stylist and commenting on their uploaded wardrobe. Invite them to ask for outfit advice."
}
Do not add markdown or explanatory text before or after the JSON.
"""

def analyze_video_service(video_path: str):
    print(f"Uploading file: {video_path}")
    try:
        video_file = client.files.upload(file=video_path)
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise e
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

    return json.loads(response.text)

def clean_and_parse_json(response_text):
    # Try to find JSON block enclosed in markdown code formatting
    match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
    if match:
        json_str = match.group(1)
    else:
        # Try to find the first outer set of curly braces
        # This regex matches { ... } including newlines
        match = re.search(r"(\{.*\})", response_text, re.DOTALL)
        if match:
            json_str = match.group(1)
        else:
            json_str = response_text

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Attempt to clean up common issues (like trailing commas) if needed, 
        # but for now fallback to treating the whole text as the response if parsing fails completely.
        # However, if we found a "match" but it failed to parse, it might be partial.
        # Let's fallback to the original robust strategy: 
        # If we can't parse JSON, we assume the model just chatted.
        return {"text": response_text, "related_item_ids": []}

def get_current_weather(lat: float, lon: float):
    """
    Fetches current weather from Open-Meteo API.
    Returns a string description like "Rainy, 15°C" or None if failed.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&timezone=auto"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if "current" in data:
            temp = data["current"]["temperature_2m"]
            code = data["current"]["weather_code"]
            
            # WMO Weather interpretation codes (simplified)
            # 0: Clear sky
            # 1, 2, 3: Mainly clear, partly cloudy, and overcast
            # 45, 48: Fog
            # 51, 53, 55: Drizzle
            # 61, 63, 65: Rain
            # 71, 73, 75: Snow
            # 80, 81, 82: Rain showers
            # 95, 96, 99: Thunderstorm
            
            condition = "Unknown"
            if code == 0: condition = "Clear sky"
            elif code in [1, 2, 3]: condition = "Cloudy"
            elif code in [45, 48]: condition = "Foggy"
            elif code in [51, 53, 55, 61, 63, 65, 80, 81, 82]: condition = "Rainy"
            elif code in [71, 73, 75, 77, 85, 86]: condition = "Snowy"
            elif code in [95, 96, 99]: condition = "Thunderstorm"
            
            return f"{condition}, {temp}°C"
            
    except Exception as e:
        print(f"Weather Fetch Error: {e}")
        return None
    
    return None

def chat_with_stylist_service(user_message: str, chat_history: list, inventory_context: list, lat: float = None, lon: float = None):
    """
    Handles chat interaction with Google Search Grounding.
    user_message: The current user message
    chat_history: List of previous messages
    inventory_context: List of wardrobe items
    """
    if not client:
        raise ValueError("GenAI client not initialized.")

    # 1. Fetch Weather Context if location available
    weather_context = ""
    if lat and lon:
        weather_info = get_current_weather(lat, lon)
        if weather_info:
             weather_context = f"User Location Weather: {weather_info}"
             print(f"Weather Context: {weather_context}")

    # Construct context from inventory
    # Using JSON string representation as requested by the prompt structure requirement
    inventory_json = json.dumps(inventory_context, indent=2)
    
    system_instruction = f"""
    You are a personal stylist. You have access to the following user wardrobe inventory: 
    {inventory_json}
    
    {weather_context}
    
    INSTRUCTIONS:
    1. Use these items to create outfits. 
    2. If weather context is provided above, you MUST adapt your recommendations (e.g., layers for cold, breathable for heat) and mention the weather explicitly in your reasoning.
    3. If the user asks to buy something new that matches, USE THE SEARCH TOOL to find real shopping links.

    IMPORTANT: You must answer strictly in a valid JSON format. Do not include any conversational text outside the JSON object. 
    The structure must be: {{"text": "...", "related_item_ids": [...]}}.
    
    Example response structure:
    {{
      "text": "Your natural, friendly response here. Do NOT mention technical IDs (like item_01) in this text.",
      "related_item_ids": ["item_id_1", "item_id_2"]
    }}
    """

    # Construct contents
    contents = []
    
    # Add history
    for msg in chat_history:
        # Map frontend roles to Gemini roles if needed (user/model)
        role = "user" if msg.get("role") == "user" else "model"
        # Skip if content is empty or null
        if msg.get("content"):
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
            
    # Add current user message
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    # Google Search Tool Configuration
    google_search_tool = types.Tool(
        google_search=types.GoogleSearch()
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                tools=[google_search_tool],
                system_instruction=system_instruction
            )
        )
        
        # Extract sources from grounding metadata if available
        sources = []
        if response.candidates and response.candidates[0].grounding_metadata:
            metadata = response.candidates[0].grounding_metadata
            if metadata.grounding_chunks:
                for chunk in metadata.grounding_chunks:
                    if chunk.web:
                        sources.append({
                            "title": chunk.web.title,
                            "uri": chunk.web.uri
                        })
        
        # Parse the JSON response from Gemini using helper
        parsed_response = clean_and_parse_json(response.text)
        
        # Robust extraction of text
        text_response = parsed_response.get("text")
        
        if not text_response:
             # If text is missing or empty, try to use the raw response if it's not JSON-like
             if response.text and not response.text.strip().startswith("{"):
                text_response = response.text
             else:
                text_response = "Here is what I found for you."
        
        related_ids = parsed_response.get("related_item_ids", [])

        related_ids = parsed_response.get("related_item_ids", [])

        return {
            "text": text_response,
            "related_item_ids": related_ids,
            "sources": sources
        }

    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        # Return a graceful fallback
        return {
            "text": "I'm having a little trouble connecting to the fashion world right now. Please try again.",
            "sources": []
        }
