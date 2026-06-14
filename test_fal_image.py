import os
import sys
from dotenv import load_dotenv

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))
load_dotenv(dotenv_path="backend/.env", override=True)

import fal_client

def test_image_gen():
    print("Testing image generation with fal-ai/flux/schnell...")
    prompt = (
        "A professional studio catalog photograph of a Variable Displacement Axial Piston Pump, "
        "B2B Standard Code: PUMP-AX-V70-H4, high-resolution, industrial machinery, "
        "isolated on a pure, solid white background, high contrast, clean shot."
    )
    try:
        handler = fal_client.submit(
            "fal-ai/flux/schnell",
            arguments={
                "prompt": prompt,
                "image_size": "square_hd",
                "sync_mode": True
            }
        )
        result = handler.get()
        print("Success! Image result:")
        print(result)
        image_url = result["images"][0]["url"]
        print(f"Generated Image URL: {image_url}")
    except Exception as e:
        print(f"Failed to generate image: {e}")

if __name__ == "__main__":
    test_image_gen()
