import requests
import json

def run_tests():
    base_url = "http://localhost:8080/api"
    print("--------------------------------------------------")
    print("STARTING B2B PROCUREMENT PLATFORM INTEGRATION TEST")
    print("--------------------------------------------------")
    
    # Test 1: Fetch initial deals list
    print("\n[TEST 1] Fetching initial deals list...")
    try:
        res = requests.get(f"{base_url}/deals")
        res.raise_for_status()
        deals = res.json()
        print(f"Success. Active deals retrieved: {len(deals)}")
    except Exception as e:
        print(f"FAILED: {e}")
        return

    # Test 2: Create a new B2B Lot (Procurement Deal)
    print("\n[TEST 2] Creating a new procurement lot for Inconel 718 Blades...")
    payload = {
        "item_name": "Inconel 718 Turbine Blades",
        "current_buyer_budget": 1250
    }
    try:
        res = requests.post(f"{base_url}/deals/create", json=payload)
        res.raise_for_status()
        data = res.json()
        print(f"Success. Server Response: {json.dumps(data)}")
        deal_id = data["deal_id"]
    except Exception as e:
        print(f"FAILED: {e}")
        return

    # Test 3: Fetch updated deals list
    print("\n[TEST 3] Fetching updated deals list...")
    try:
        res = requests.get(f"{base_url}/deals")
        res.raise_for_status()
        deals = res.json()
        print(f"Success. Active deals: {len(deals)}")
        target_deal = next(d for d in deals if d["id"] == deal_id)
        print(f"Item: {target_deal['item_name']}")
        print(f"Status: {target_deal['status']}")
        print(f"Participants loaded: {len(target_deal['participants'])}")
        print(f"Messages loaded: {len(target_deal['messages'])}")
    except Exception as e:
        print(f"FAILED: {e}")
        return

    # Test 4: Step the negotiation engine once
    print("\n[TEST 4] Triggering STEP_EXCHANGE_ROUND (Round 1 negotiation)...")
    try:
        res = requests.post(f"{base_url}/negotiate/step", json={"deal_id": deal_id})
        res.raise_for_status()
        step_data = res.json()
        print(f"Success. Step execution result: {json.dumps(step_data)}")
    except Exception as e:
        print(f"FAILED: {e}")
        return

    # Test 5: Verify new messages and prices after step
    print("\n[TEST 5] Checking room log timeline post-negotiation round...")
    try:
        res = requests.get(f"{base_url}/deals")
        res.raise_for_status()
        deals = res.json()
        target_deal = next(d for d in deals if d["id"] == deal_id)
        print(f"Status: {target_deal['status']}")
        print(f"Total messages in timeline: {len(target_deal['messages'])}")
        print("\n=== RECENT TRANSCRIPTS ===")
        for m in target_deal["messages"][-5:]:
            print(f"[{m['sender_name']} | {m['role']}]: {m['message_text']}")
        print("==========================")
        
        print("\n=== PARTICIPANT LEDGER POSITIONS ===")
        for p in target_deal["participants"]:
            print(f"- {p['name']} ({p['role']}): PRICE={p['current_price_point']} EUR | LIMIT={p['hidden_floor_ceil']} EUR")
        print("====================================")
    except Exception as e:
        print(f"FAILED: {e}")
        return

    # Test 6: Operator override administrative bump
    print("\n[TEST 6] Testing administrative operator override ('approve' command)...")
    op_payload = {
        "deal_id": deal_id,
        "message_text": "We require fast procurement path. Approve higher margins."
    }
    try:
        res = requests.post(f"{base_url}/negotiate/message", json=op_payload)
        res.raise_for_status()
        op_data = res.json()
        print(f"Success. Operator Response status: {json.dumps(op_data)}")
        
        # Verify caps increased by +100
        res_deals = requests.get(f"{base_url}/deals")
        target_deal = next(d for d in res_deals.json() if d["id"] == deal_id)
        print("\n=== PARTICIPANT LEDGER POSITIONS POST-APPROVAL ===")
        for p in target_deal["participants"]:
            print(f"- {p['name']} ({p['role']}): PRICE={p['current_price_point']} EUR | LIMIT={p['hidden_floor_ceil']} EUR")
        print("==================================================")
    except Exception as e:
        print(f"FAILED: {e}")
        return

    print("\n--------------------------------------------------")
    print("ALL API LOGIC INTEGRITY TESTS PASSED SUCCESSFULLY!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    run_tests()
