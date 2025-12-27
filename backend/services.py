import os
import time
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

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
    
    # Clean up file from Gemini storage (optional but good practice)
    # client.files.delete(name=video_file.name) 
    # Leaving it for now as per "Hackathon" speed, but maybe clear it later.

    return json.loads(response.text)

def chat_with_stylist_service(user_message: str, chat_history: list, inventory_context: list):
    """
    Handles chat interaction with Google Search Grounding.
    user_message: The current user message
    chat_history: List of previous messages
    inventory_context: List of wardrobe items
    """
    if not client:
        raise ValueError("GenAI client not initialized.")

    # Construct context from inventory
    # Using JSON string representation as requested by the prompt structure requirement
    inventory_json = json.dumps(inventory_context, indent=2)
    
    # Translated prompt from user request:
    # "Eres un estilista personal. Tienes acceso al siguiente inventario de ropa del usuario: {INVENTORY_JSON}. 
    # Usa estas prendas para crear outfits. Si el usuario pide comprar algo nuevo que combine, 
    # USA LA HERRAMIENTA DE BÚSQUEDA para encontrar enlaces reales de compra.
    # IMPORTANTE: Tu respuesta debe ser un objeto JSON con la estructura:
    # {
    #   "text": "Tu respuesta natural y amable aquí (NO uses IDs técnicos como Item_XXX en este texto)",
    #   "related_item_ids": ["Item_001", "Item_004"] (Lista de IDs de items mencionados o relevantes)
    # }"
    system_instruction = f"""
    You are a personal stylist. You have access to the following user wardrobe inventory: 
    {inventory_json}
    
    Use these items to create outfits. If the user asks to buy something new that matches, 
    USE THE SEARCH TOOL to find real shopping links.

    IMPORTANT: You must return a valid JSON object with the following structure:
    {{
      "text": "Your natural, friendly response here. Do NOT mention technical IDs (like item_01) in this text.",
      "related_item_ids": ["item_id_1", "item_id_2"] // List of item IDs referenced in your response
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
            model="gemini-3-flash-preview",
            contents=contents,
            config=types.GenerateContentConfig(
                tools=[google_search_tool],
                system_instruction=system_instruction,
                response_mime_type="application/json"
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
        
        # Parse the JSON response from Gemini
        try:
            parsed_response = json.loads(response.text)
            text_response = parsed_response.get("text", "I found some items for you.")
            related_ids = parsed_response.get("related_item_ids", [])
        except json.JSONDecodeError:
            # Fallback if raw text is returned
            text_response = response.text
            related_ids = []

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
