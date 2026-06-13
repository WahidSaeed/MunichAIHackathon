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
    """Uses Tavily to pull contextual background market data to feed into the loops."""
    try:
        context = tavily_client.get_search_context(query=f"{query} market price industrial", max_results=2)
        return context
    except Exception:
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