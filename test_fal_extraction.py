import sys
import os
import json
from dotenv import load_dotenv

# Ensure backend directory is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

# Load env
load_dotenv(dotenv_path="backend/.env", override=True)

from agents import extract_rfq_from_image_via_fal

def test_fal():
    print("Testing extract_rfq_from_image_via_fal with a mock 1x1 gif in base64...")
    
    # Tiny 1x1 black GIF image base64
    mock_base64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    
    try:
        res = extract_rfq_from_image_via_fal(mock_base64)
        print("Success! Response from Fal extraction:")
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(f"Exception raised during function call: {e}")

if __name__ == "__main__":
    test_fal()
