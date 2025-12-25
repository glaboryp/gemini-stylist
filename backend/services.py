import os
import time
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

MODEL_ID = "gemini-3-flash-preview"

client = genai.Client(api_key=GEMINI_API_KEY)

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

Output:
Return ONLY a valid JSON object containing a list under the key "inventory". Do not add markdown or explanatory text before or after the JSON.
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

    print(f"Content generated: {response.text}")
    
    # Clean up file from Gemini storage (optional but good practice)
    # client.files.delete(name=video_file.name) 
    # Leaving it for now as per "Hackathon" speed, but maybe clear it later.

    return json.loads(response.text)
