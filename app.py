import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import tavily
import fal_client

# Load our credentials securely
load_dotenv()

# Initialize the cloud clients natively
# This keeps our local M1 memory footprint tiny
gemini_client = genai.Client()
tavily_client = tavily.TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def execute_hackathon_pipeline(user_prompt: str):
    print("✨ Phase 1: Gathering real-time intelligence via Tavily...")
    # Clean background search execution
    search_context = tavily_client.get_search_context(
        query=f"{user_prompt} manufacturing specs standards",
        max_results=2
    )
    
    print("🧠 Phase 2: Processing intelligence via Google DeepMind...")
    # Use gemini-2.5-flash for lightning fast processing loops
    orchestration_prompt = f"""
    You are an expert technical agent. Review this search context and provide an optimized image generation prompt based on it.
    
    Search Context:
    {search_context}
    
    Target Topic: {user_prompt}
    
    Output ONLY a highly descriptive visual prompt suitable for an image generation model. No introduction, no markdown blocks.
    """
    
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=orchestration_prompt
    )
    optimized_visual_prompt = response.text.strip()
    print(f"🤖 Generated Visual Prompt: '{optimized_visual_prompt}'")
    
    print("🎨 Phase 3: Executing high-fidelity generation via Fal.ai...")
    # Triggering serverless generative media inference
    fal_result = fal_client.run(
        "fal-ai/flux/schnell",
        arguments={
            "prompt": optimized_visual_prompt,
            "image_size": "landscape_16_9"
        }
    )
    
    image_url = fal_result["images"][0]["url"]
    print(f"🚀 Success! 3-Partner Pipeline Complete.")
    print(f"🖼️ Generated Asset URL: {image_url}")
    return image_url

# Uncomment to test your workspace runtime when keys are entered!
# if __name__ == "__main__":
#     execute_hackathon_pipeline("A sustainable automated electric procurement drone chassis")