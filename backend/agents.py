import os
import json
from google import genai
from google.genai import types
from tavily import TavilyClient
from dotenv import load_dotenv

# Force system to reload environment variables securely on execution
load_dotenv(override=True)

# Initialize cloud engines (keeps local M1 memory usage negligible)
client = genai.Client()
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

SELLER_SYSTEM = """You are an automated B2B Seller Agent representing an equipment distributor. 
The lowest acceptable floor price your business model supports is 950 EUR, but your target listing is 1200 EUR. 
Defend your margins by highlighting immediate availability and component quality.
Your output must be a clean JSON object following this exact schema:
{
  "message": "Your text response or counter-offer to the buyer.",
  "requested_price": 1100
}
Output ONLY raw JSON. Do not wrap your response in markdown code blocks or backticks."""

def build_buyer_system(budget_cap: int) -> str:
    return f"""You are an automated B2B Buyer Agent representing an industrial assembly line.
Your goal is to acquire the equipment specified under the absolute maximum budget constraint of {budget_cap} EUR.
You must negotiate strategically, citing realistic market constraints.
Your output must be a clean JSON object following this exact schema:
{{
  "message": "Your text message or counter-offer to the seller.",
  "offered_price": 850
}}
Output ONLY raw JSON. Do not wrap your response in markdown code blocks or backticks."""

def get_market_insights(query: str) -> str:
    """Uses Tavily to pull contextual background market data, formatting it cleanly as a document."""
    try:
        context = tavily_client.get_search_context(query=f"{query} market price industrial", max_results=2)
        # Attempt to parse and format the JSON response into a professional human-readable report
        try:
            data = json.loads(context)
            if isinstance(data, list):
                lines = [
                    f"# MARKET INTELLIGENCE REPORT: {query.upper()}",
                    "",
                    "__This research document summarizes current market pricing and specifications gathered via live search indexing.__",
                    "",
                    "---",
                    ""
                ]
                for idx, item in enumerate(data, 1):
                    url = item.get("url", "N/A")
                    content = item.get("content", "").strip()
                    # Clean up continuous whitespaces and formatting
                    content_cleaned = " ".join(content.split())
                    
                    lines.append(f"## [{idx}] Source Documentation")
                    lines.append(f"- **Reference URL**: {url}")
                    lines.append("")
                    lines.append("### Relevant Specifications & Extracts")
                    lines.append(f"*\"{content_cleaned}\"*")
                    lines.append("")
                    lines.append("---")
                    lines.append("")
                return "\n".join(lines)
        except Exception as format_err:
            print(f"Failed to parse and format Tavily JSON context: {format_err}")
            
        return context
    except Exception as e:
        print(f"Error during Tavily search context fetch: {e}")
        return "Standard market valuation parameters apply."

def run_agent_turn(role: str, conversation_history: list, budget_cap: int = 1000) -> dict:
    """Executes a structured generative inference step using Gemini-2.5-Flash."""
    system_instruction = build_buyer_system(budget_cap) if role == "Buyer" else SELLER_SYSTEM
    context_stream = "\n".join(conversation_history)
    full_prompt = f"Negotiation Context History:\n{context_stream}\n\nExecute your role's calculation step now."

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=full_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            response_mime_type="application/json",  # Hard-enforces native JSON structure
        )
    )

    try:
        return json.loads(response.text)
    except Exception:
        # Graceful schema fallback in case of parsing exceptions
        fallback_key = "offered_price" if role == "Buyer" else "requested_price"
        return {
            "message": "We need to re-evaluate our position regarding the current asset valuations.",
            fallback_key: 950
        }

def check_negotiation_status(buyer_data: dict, seller_data: dict, buyer_max: int) -> dict:
    """
    Evaluates whether an automated agreement is hit or if the workflow
    needs to escalate to a human operator due to a budget ceiling conflict.
    """
    offer = buyer_data.get("offered_price", 0)
    ask = seller_data.get("requested_price", float("inf"))

    if offer >= ask:
        return {"status": "deal", "price": ask}

    if offer >= buyer_max:
        return {"status": "deadlock", "gap": ask - offer}

    return {"status": "continue"}


# ----------------------------------------------------------------------
# Backward Compatible Wrapper Interfaces for backend/main.py Orchestrator
# ----------------------------------------------------------------------

def run_market_intelligence(item_name: str) -> str:
    """
    Exposes market research engine to main.py, executing get_market_insights.
    """
    return get_market_insights(item_name)

def generate_agent_turn(
    participant_name: str,
    participant_role: str,
    hidden_floor_ceil: int,
    current_price: int,
    tech_specs: str,
    chat_history: list[dict]
) -> dict:
    """
    Translates main.py exchange state parameters into run_agent_turn's signature.
    Maps offered_price / requested_price back to price_point for unified database persistence.
    """
    role = "Buyer" if participant_role == "BUYER" else "Seller"
    
    # Format chat logs for the generative context history block
    conversation_history = []
    for h in chat_history:
        conversation_history.append(f"[{h['sender']} | {h['role']}]: {h['text']}")
        
    # Execute the structured generative step
    res = run_agent_turn(
        role=role,
        conversation_history=conversation_history,
        budget_cap=hidden_floor_ceil
    )
    
    # Retrieve role-specific price key
    price_key = "offered_price" if role == "Buyer" else "requested_price"
    price_val = res.get(price_key)
    
    # Secure numeric parsing
    try:
        price_point = int(price_val)
    except (TypeError, ValueError):
        price_point = hidden_floor_ceil
        
    return {
        "message": res.get("message", ""),
        "price_point": price_point
    }
