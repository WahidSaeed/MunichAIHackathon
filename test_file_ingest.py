import requests
import json
from io import BytesIO

def test_file_ingest():
    base_url = "http://localhost:8080/api"
    print("--------------------------------------------------")
    print("TESTING FILE INGESTION (PDF/DOCX/TXT/XLSX) ENDPOINT")
    print("--------------------------------------------------")
    
    # Simulate a TXT document upload
    mock_file_content = (
        "Subject: RFQ - high-contrast industrial component\n\n"
        "Need some 'HYDRAULIC ACTUATOR ROTOR' for the production line.\n"
        "Budget Cap: 1950 EUR.\n"
        "Extracted Specs:\n"
        "- Pressure rating: 3000 PSI\n"
        "- Stroke length: 12 inches\n"
        "- Mounting style: Rear clevis\n"
    )
    
    file_payload = {
        "file": ("hydraulic_actuator.txt", mock_file_content, "text/plain")
    }
    
    try:
        print("\n[STEP 1] Uploading file to POST /api/deals/ingest-file...")
        res = requests.post(f"{base_url}/deals/ingest-file", files=file_payload)
        res.raise_for_status()
        data = res.json()
        print(f"Success. Server Response: {json.dumps(data, indent=2)}")
        deal_id = data["deal_id"]
        
        print("\n[STEP 2] Verifying seeded deal in postgres...")
        res_deals = requests.get(f"{base_url}/deals")
        res_deals.raise_for_status()
        deals = res_deals.json()
        
        target_deal = next((d for d in deals if d["id"] == deal_id), None)
        if not target_deal:
            print(f"FAILED: Deal ID {deal_id} not found in database.")
            return
            
        print(f"Seeded Deal Name: {target_deal['item_name']}")
        print(f"Current Budget Cap: {target_deal['current_buyer_budget']} EUR")
        print(f"Perspective Stance: {target_deal['perspective']}")
        print(f"Participants Seeded: {len(target_deal['participants'])}")
        
        print("\n=== TECHNICAL SPECS WITH INTEGRATED TAVILY RESEARCH ===")
        print(target_deal["technical_specs"][:500] + "...\n[TRUNCATED IN OUTPUT]")
        print("=========================================================")
        
        print("\n--------------------------------------------------")
        print("FILE INGESTION END-TO-END TEST PASSED SUCCESSFULLY!")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_file_ingest()
