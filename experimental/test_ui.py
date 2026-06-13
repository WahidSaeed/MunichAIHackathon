import streamlit as st
import sys
import os

# 1. Core Window Configuration
st.set_page_config(page_title="Atira Sandbox", page_icon="🕵️‍♂️", layout="wide")

# 2. State Handlers Initialization
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        "Seller: I have listed the equipment for 1,200 EUR. Firm price."
    ]
if "agent_blocked" not in st.session_state:
    st.session_state.agent_blocked = False
if "buyer_budget" not in st.session_state:
    st.session_state.buyer_budget = 1000
if "deal_closed" not in st.session_state:
    st.session_state.deal_closed = False

# 3. Explicit Root Namespace Path Insertion
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.agents import run_agent_turn, get_market_insights, check_negotiation_status

# 4. Interface Rendering Look and Feel
st.title("🕵️‍♂️ Atira Track Sandbox: Multi-Agent Validation")
st.caption("Validating state changes, dynamic Tavily inputs, and automated deadlock boundaries")

col1, col2 = st.columns([2, 1])

with col1:
    st.markdown("### 🗣️ Active Agent Stream")
    for msg in st.session_state.chat_history:
        if msg.startswith("Buyer Agent:"):
            st.info(msg)
        elif msg.startswith("Seller:"):
            st.success(msg)
        else:
            st.warning(msg)

with col2:
    st.markdown("### 🎛️ Operator Controls")
    st.metric("Current Buyer Budget Cap", f"{st.session_state.buyer_budget} EUR")
    
    # Execution Step Action Trigger
    if st.button("Step Real Agent Turn", disabled=st.session_state.agent_blocked or st.session_state.deal_closed):
        
        # Pull online research on turn zero to fulfill 3-partner technology criteria
        if len(st.session_state.chat_history) == 1:
            with st.spinner("Tavily gathering market baseline parameters..."):
                insights = get_market_insights("Industrial M1 Machinery")
                st.session_state.chat_history.append(f"System Market Context: {insights[:200]}...")

        with st.spinner("Agents processing strategy..."):
            # Turn Step A: Compute Buyer Intent
            buyer_data = run_agent_turn("Buyer", st.session_state.chat_history, st.session_state.buyer_budget)
            st.session_state.chat_history.append(f"Buyer Agent: {buyer_data['message']} [Offer: {buyer_data.get('offered_price')} EUR]")

            # Turn Step B: Compute Seller Response
            seller_data = run_agent_turn("Seller", st.session_state.chat_history)
            st.session_state.chat_history.append(f"Seller: {seller_data['message']} [Asking: {seller_data.get('requested_price')} EUR]")

            # Turn Step C: Evaluate State Resolution Parameters
            status = check_negotiation_status(buyer_data, seller_data, st.session_state.buyer_budget)
            
            if status["status"] == "deal":
                st.session_state.deal_closed = True
                st.session_state.chat_history.append(f"✅ DEAL CLOSED at {status['price']} EUR")
            elif status["status"] == "deadlock":
                st.session_state.agent_blocked = True

            st.rerun()

    # 5. Clean Structured Human In The Loop Execution Box
    if st.session_state.agent_blocked:
        st.error("🚨 HUMAN IN THE LOOP REQUIRED: Negotiation Deadlock")
        st.write(f"Buyer is at the strict budget ceiling ({st.session_state.buyer_budget} EUR). The seller has refused to match.")

        decision = st.radio("Resolve Deadlock Status:", ["Approve Budget Bump (+100 EUR)", "Terminate Negotiation"])

        if st.button("Submit Operator Override"):
            if decision.startswith("Approve"):
                st.session_state.buyer_budget += 100
                st.session_state.chat_history.append(
                    f"System Notice: Operator increased budget to {st.session_state.buyer_budget} EUR"
                )
                st.session_state.agent_blocked = False
            else:
                st.session_state.chat_history.append("System Notice: Negotiation terminated by operator")
                st.session_state.deal_closed = True
                st.session_state.agent_blocked = False

            st.rerun()