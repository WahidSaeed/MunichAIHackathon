import requests
import json

def test_bagel_ingest():
    base_url = "http://localhost:8080/api"
    print("--------------------------------------------------")
    print("TESTING TRACK 2 FAL.AI BAGEL IMAGE URL INGESTION ENDPOINT")
    print("--------------------------------------------------")
    
    # Public demonstration image URL
    demo_image_url = "https://storage.googleapis.com/falserverless/bagel/wRhCPSyiKTiLnnWvUpGIl.jpeg"
    payload = {"raw_text": demo_image_url}
    
    try:
        print(f"\n[STEP 1] Sending POST /api/deals/ingest with image URL: {demo_image_url}")
        res = requests.post(f"{base_url}/deals/ingest", json=payload)
        res.raise_for_status()
        data = res.json()
        print(f"Success. Server Response: {json.dumps(data, indent=2)}")
        deal_id = data["deal_id"]
        
        print("\n[STEP 2] Verifying seeded deal in the database...")
        res_deals = requests.get(f"{base_url}/deals")
        res_deals.raise_for_status()
        deals = res_deals.json()
        
        target_deal = next((d for d in deals if d["id"] == deal_id), None)
        if not target_deal:
            print(f"FAILED: Deal ID {deal_id} not found in deals list.")
            return
            
        print(f"Seeded Deal Name: {target_deal['item_name']}")
        print(f"Current Budget Cap: {target_deal['current_buyer_budget']} EUR")
        print(f"Perspective Stance: {target_deal['perspective']}")
        print(f"Participants Seeded: {len(target_deal['participants'])}")
        for p in target_deal["participants"]:
            print(f"  - {p['name']} ({p['role']}): Start Bid={p['current_price_point']} | Bound={p['hidden_floor_ceil']}")
            
        print("\n=== TECHNICAL SPECS WITH INTEGRATED TAVILY RESEARCH ===")
        print(target_deal["technical_specs"][:500] + "...\n[TRUNCATED IN OUTPUT]")
        print("=========================================================")
        
        print("\n--------------------------------------------------")
        print("TRACK 2 FAL.AI BAGEL IMAGE INGESTION PASSED SUCCESSFULLY!")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_bagel_ingest()
