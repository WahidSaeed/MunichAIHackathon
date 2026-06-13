import os
from dotenv import load_dotenv
from tavily import TavilyClient

# Load env variables from backend/.env
load_dotenv("backend/.env", override=True)
api_key = os.getenv("TAVILY_API_KEY")
print(f"API KEY: {api_key[:10]}...")

client = TavilyClient(api_key=api_key)
res = client.get_search_context(query="Inconel 718 Turbine Blades market price industrial", max_results=2)
print("TYPE:", type(res))
print("CONTENT:")
print(res)
