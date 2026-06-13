import os
import uuid
from typing import Optional
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Deal, Participant, Message
from .agents import run_market_intelligence, generate_agent_turn

# SQLAlchemy automatic table migration on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Atira B2B Procurement Multi-Agent Exchange Room",
    description="Production-grade, text-heavy, high-contrast B2B Procurement and Escrow settlement backend.",
    lifespan=lifespan
)

# Enable CORS policies for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Pydantic schemas
class DealCreateRequest(BaseModel):
    item_name: str
    current_buyer_budget: Optional[int] = 1200
    perspective: Optional[str] = "BUYER" # BUYER or SELLER

class NegotiateStepRequest(BaseModel):
    deal_id: str

class OperatorMessageRequest(BaseModel):
    deal_id: str
    message_text: str

@app.get("/api/deals")
def list_deals(db: Session = Depends(get_db)):
    """
    Fetches all B2B procurement deals, complete with live participant ledger lines and conversation logs.
    """
    deals = db.query(Deal).order_by(Deal.created_at.desc()).all()
    result = []
    for d in deals:
        parts = db.query(Participant).filter(Participant.deal_id == d.id).all()
        msgs = db.query(Message).filter(Message.deal_id == d.id).order_by(Message.timestamp.asc()).all()
        result.append({
            "id": str(d.id),
            "item_name": d.item_name,
            "status": d.status,
            "current_buyer_budget": d.current_buyer_budget,
            "technical_specs": d.technical_specs,
            "perspective": d.perspective,
            "created_at": d.created_at,
            "participants": [{
                "id": str(p.id),
                "name": p.name,
                "role": p.role,
                "current_price_point": p.current_price_point,
                "hidden_floor_ceil": p.hidden_floor_ceil
            } for p in parts],
            "messages": [{
                "id": str(m.id),
                "sender_name": m.sender_name,
                "role": m.role,
                "message_text": m.message_text,
                "timestamp": m.timestamp
            } for m in msgs]
        })
    return result

@app.post("/api/deals/create")
def create_deal(payload: DealCreateRequest, db: Session = Depends(get_db)):
    """
    Initializes a new procurement deal. Uses Tavily search to fetch market specifications,
    seeds participants with their private thresholds, and broadcasts the channel activation logs.
    """
    deal_id = uuid.uuid4()
    
    # Run market intelligence research synchronously or mock fallback
    intel_report = run_market_intelligence(payload.item_name)
    
    perspective = payload.perspective if payload.perspective in ["BUYER", "SELLER"] else "BUYER"
    
    new_deal = Deal(
        id=deal_id,
        item_name=payload.item_name,
        status="ACTIVE",
        current_buyer_budget=payload.current_buyer_budget,
        technical_specs=intel_report,
        perspective=perspective
    )
    db.add(new_deal)
    
    # Seed participants based on perspective
    if perspective == "BUYER":
        participants_seed = [
            Participant(
                id=uuid.uuid4(),
                deal_id=deal_id,
                name="Buyer (You)",
                role="BUYER",
                current_price_point=850,
                hidden_floor_ceil=payload.current_buyer_budget
            ),
            Participant(
                id=uuid.uuid4(),
                deal_id=deal_id,
                name="Seller Agent",
                role="SELLER",
                current_price_point=payload.current_buyer_budget + 150,
                hidden_floor_ceil=payload.current_buyer_budget - 150
            )
        ]
        announcement_suffix = "BUYER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE BUYER (Counter-Offers trigger Seller Agent turns)."
    else:
        participants_seed = [
            Participant(
                id=uuid.uuid4(),
                deal_id=deal_id,
                name="Buyer Agent",
                role="BUYER",
                current_price_point=850,
                hidden_floor_ceil=payload.current_buyer_budget
            ),
            Participant(
                id=uuid.uuid4(),
                deal_id=deal_id,
                name="Seller (You)",
                role="SELLER",
                current_price_point=payload.current_buyer_budget + 150,
                hidden_floor_ceil=payload.current_buyer_budget - 150
            )
        ]
        announcement_suffix = "SELLER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE SELLER (Counter-Offers trigger Buyer Agent turns)."
    
    for p in participants_seed:
        db.add(p)
        
    # Inject channel initialization announcements
    announcements = [
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"DEAL ENVIRONMENT REGISTERED FOR LOT '{payload.item_name.upper()}'."
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"TAVILY CONTEXT INJECTED:\n{intel_report}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=announcement_suffix
        )
    ]
    
    for msg in announcements:
        db.add(msg)
        
    db.commit()
    
    return {"status": "SUCCESS", "deal_id": str(deal_id)}

@app.post("/api/negotiate/step")
def negotiate_step(payload: NegotiateStepRequest, db: Session = Depends(get_db)):
    """
    Executes a round-robin trade calculation where each participant evaluates the unified chat log,
    modulates their bids/asks, and passes updated values to the Multi-Party Settlement Engine.
    """
    deal_uuid = uuid.UUID(payload.deal_id)
    deal = db.query(Deal).filter(Deal.id == deal_uuid).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal registry not found.")
        
    if deal.status != "ACTIVE":
        return {
            "status": "HALTED",
            "message": f"Orchestration paused. Current registry state: {deal.status}.",
            "deal_status": deal.status
        }
        
    participants = db.query(Participant).filter(Participant.deal_id == deal_uuid).all()
    
    # We retrieve the recent message list to formulate context
    messages_query = db.query(Message).filter(Message.deal_id == deal_uuid).order_by(Message.timestamp.asc()).all()
    chat_history = [{
        "sender": m.sender_name,
        "role": m.role,
        "text": m.message_text
    } for m in messages_query]
    
    # 1. Run sequential multi-agent calculations
    for p in participants:
        # Check if the deal was matched midway
        if deal.status != "ACTIVE":
            break
            
        # Bypass AI turn calculation for the active human role
        if deal.perspective == "BUYER" and p.role == "BUYER":
            continue
        if deal.perspective == "SELLER" and p.role == "SELLER":
            continue
            
        turn_data = generate_agent_turn(
            participant_name=p.name,
            participant_role=p.role,
            hidden_floor_ceil=p.hidden_floor_ceil,
            current_price=p.current_price_point,
            tech_specs=deal.technical_specs,
            chat_history=chat_history
        )
        
        # Save positions to participant ledger
        p.current_price_point = turn_data["price_point"]
        
        # Save message transcript to the unified deal timeline
        new_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name=p.name,
            role=p.role,
            message_text=turn_data["message"]
        )
        db.add(new_msg)
        db.flush() # Ensure database is up-to-date with this message for subsequent turns
        
        # Append to active runtime chat history array for the subsequent participant in loop
        chat_history.append({
            "sender": p.name,
            "role": p.role,
            "text": turn_data["message"]
        })
        
    db.commit()
    
    # Refresh objects after flush/commit to ensure correct pricing matrices
    db.refresh(deal)
    participants = db.query(Participant).filter(Participant.deal_id == deal_uuid).all()
    
    # 2. RUN MULTI-PARTY SETTLEMENT EVALUATION
    buyers = [p for p in participants if p.role == "BUYER"]
    sellers = [p for p in participants if p.role == "SELLER"]
    
    if not buyers or not sellers:
        return {"status": "SUCCESS", "deal_status": deal.status}
        
    # Sort Bids Descending and Asks Ascending
    buyers_sorted = sorted(buyers, key=lambda x: x.current_price_point, reverse=True)
    sellers_sorted = sorted(sellers, key=lambda x: x.current_price_point)
    
    highest_bidder = buyers_sorted[0]
    lowest_seller = sellers_sorted[0]
    
    highest_bid = highest_bidder.current_price_point
    lowest_ask = lowest_seller.current_price_point
    
    # A. Match Condition: Highest Bid >= Lowest Ask
    if highest_bid >= lowest_ask:
        matched_price = lowest_ask # cross-match deal settles at the seller's asking price
        deal.status = "MATCHED"
        
        match_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=(
                f"AUTOMATED CROSS-MATCH DETECTED. B2B EXCHANGE COMPLETE. "
                f"EXECUTING ESCROW FOR LOT '{deal.item_name.upper()}' AT PRICE {matched_price} EUR.\n"
                f"MATCH CONTRACT PARTIES: {highest_bidder.name} (BUYER) <=> {lowest_seller.name} (SELLER)."
            )
        )
        db.add(match_msg)
        db.commit()
        return {"status": "MATCHED", "price": matched_price, "parties": f"{highest_bidder.name} <=> {lowest_seller.name}"}
        
    # B. Soft Unblock Condition: Price margin <= 50 EUR (exclusive of direct matches)
    elif (lowest_ask - highest_bid) <= 50:
        compromise_price = int((lowest_ask + highest_bid) / 2)
        deal.status = "MATCHED"
        
        compromise_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=(
                f"AUTONOMOUS COMPROMISE TRIGGERED (MARGIN IS {lowest_ask - highest_bid} EUR <= 50 EUR).\n"
                f"MARKET MAKER COMPROMISE ESTABLISHED AT PRICE {compromise_price} EUR.\n"
                f"CONTRACT BOND: {highest_bidder.name} (BUYER) <=> {lowest_seller.name} (SELLER)."
            )
        )
        db.add(compromise_msg)
        db.commit()
        return {"status": "MATCHED", "price": compromise_price, "parties": f"{highest_bidder.name} <=> {lowest_seller.name}"}
        
    # C. Hard Deadlock Condition: All buyers hit their budget caps AND all sellers at their floor thresholds
    # Let's inspect if participants are restricted by budget ceilings or floor floors
    deadlock_buyers = all(p.current_price_point >= p.hidden_floor_ceil for p in buyers)
    deadlock_sellers = all(p.current_price_point <= p.hidden_floor_ceil for p in sellers)
    
    if deadlock_buyers and deadlock_sellers:
        deal.status = "DEADLOCK"
        deadlock_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=(
                "HARD DEADLOCK DETECTED. ALL BUYER LIQUIDITIES CONSTRAINED BY BUDGET CEILINGS.\n"
                "ALL SELLER OFFERS BOUND BY FLOOR RESERVATION CONSTRAINTS.\n"
                "ROUND CONTEXT TERMINATED. DIRECT OPERATOR COMMAND INTERVENTION IS REQUIRED."
            )
        )
        db.add(deadlock_msg)
        db.commit()
        return {"status": "DEADLOCK"}
        
    return {"status": "ACTIVE", "deal_status": deal.status}

@app.post("/api/negotiate/message")
def operator_message(payload: OperatorMessageRequest, db: Session = Depends(get_db)):
    """
    Accepts operator messages in the chat pool. Inspects the override payload for commands:
    - 'approve': adds +100 EUR to all buyer caps and reactivates the trade engine.
    - 'terminate': halts active deal pools instantly.
    Otherwise, if the channel has BUYER or SELLER perspective, updates the human participant's bid/ask.
    """
    deal_uuid = uuid.UUID(payload.deal_id)
    deal = db.query(Deal).filter(Deal.id == deal_uuid).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal registry not found.")
        
    sender_name = "Operator | Abdul Wahid"
    role = "OPERATOR"
    
    if deal.perspective == "BUYER":
        sender_name = "Buyer (You)"
        role = "BUYER"
    elif deal.perspective == "SELLER":
        sender_name = "Seller (You)"
        role = "SELLER"
        
    # Log Operator interaction
    op_msg = Message(
        id=uuid.uuid4(),
        deal_id=deal_uuid,
        sender_name=sender_name,
        role=role,
        message_text=payload.message_text
    )
    db.add(op_msg)
    
    text = payload.message_text.lower()
    
    # Conversational counter-offer price extraction
    import re
    numbers = [int(n) for n in re.findall(r'\b\d+\b', payload.message_text) if 100 <= int(n) <= 10000]
    if numbers and deal.perspective in ["BUYER", "SELLER"]:
        extracted_price = numbers[0]
        target_role = "BUYER" if deal.perspective == "BUYER" else "SELLER"
        human_part = db.query(Participant).filter(Participant.deal_id == deal_uuid, Participant.role == target_role).first()
        if human_part:
            human_part.current_price_point = extracted_price
    
    if "approve" in text:
        # Increase all buyer budget caps in database by +100 EUR
        buyers = db.query(Participant).filter(Participant.deal_id == deal_uuid, Participant.role == "BUYER").all()
        for b in buyers:
            b.hidden_floor_ceil += 100
            
        deal.status = "ACTIVE"
        
        sys_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=(
                "OPERATOR ADMIN INSTRUCTION DETECTED: BUDGET INTRUSION APPROVED.\n"
                "ALL PARTICIPATING BUYER MAXIMUM BUDGET CAPS ELEVATED BY +100 EUR.\n"
                "ORCHESTRATION ENGINE RESET TO ACTIVE."
            )
        )
        db.add(sys_msg)
        
    elif "terminate" in text:
        deal.status = "TERMINATED"
        sys_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="OPERATOR OVERRIDE RECEIVED: DEAL REGISTRY HAS BEEN FORCEFULLY TERMINATED."
        )
        db.add(sys_msg)
        
    db.commit()
    return {"status": "SUCCESS", "deal_status": deal.status}
