import os
import uuid
from typing import Optional
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Deal, Participant, Message
from .agents import (
    run_market_intelligence,
    generate_agent_turn,
    ingest_unstructured_rfq_to_specifications,
    search_market_valuation_benchmarks,
    ingest_unstructured_rfq_with_fastino,
    log_trace_to_fastino_pioneer,
    extract_text_from_file_bytes,
    extract_rfq_from_image_via_fal,
    ingest_image_rfq_via_fal_bagel
)


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

class DealIngestRequest(BaseModel):
    raw_text: str

class UpdateStyleRequest(BaseModel):
    deal_id: str
    negotiation_style: str

@app.get("/api/observability/pioneer-stream")
def get_pioneer_stream(db: Session = Depends(get_db)):
    """
    Pulls recent transaction history from the database. It constructs a tracking stream list by extracting deal states,
    counting active messages, and dynamically invoking log_trace_to_fastino_pioneer for each lot.
    For deals trapped in an active DEADLOCK status, the response payload must return a populated anomaly block.
    """
    deals = db.query(Deal).order_by(Deal.created_at.desc()).all()
    stream_list = []
    for d in deals:
        msgs = db.query(Message).filter(Message.deal_id == d.id).order_by(Message.timestamp.asc()).all()
        msgs_list = [{"sender": m.sender_name, "role": m.role, "text": m.message_text} for m in msgs]
        
        # Determine if we should invoke log_trace_to_fastino_pioneer with DEADLOCK failure mode
        failure_mode = "DEADLOCK" if d.status == "DEADLOCK" else None
        pioneer_res = log_trace_to_fastino_pioneer(
            deal_id=str(d.id),
            transcript=msgs_list,
            failure_mode=failure_mode
        )
        
        # Build populated anomaly block
        if d.status == "DEADLOCK":
            anomaly_block = {
                "is_anomaly": True,
                "automated_lora_trigger": True,
                "optimization_route": "SLM-NEGOTIATION-ADAPTER-V2"
            }
        else:
            anomaly_block = {
                "is_anomaly": False,
                "automated_lora_trigger": False,
                "optimization_route": None
            }
            
        stream_list.append({
            "deal_id": str(d.id),
            "item_name": d.item_name,
            "status": d.status,
            "message_count": len(msgs),
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "pioneer_trace": pioneer_res,
            "anomaly_block": anomaly_block
        })
    return stream_list

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
            "negotiation_style": d.negotiation_style,
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
        perspective=perspective,
        negotiation_style="DISTRIBUTIVE"
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

@app.post("/api/deals/update-style")
def update_style(payload: UpdateStyleRequest, db: Session = Depends(get_db)):
    """
    Updates the active room's sourcing style dynamically.
    Fires a system timeline notification informing of the change.
    """
    try:
        deal_uuid = uuid.UUID(payload.deal_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Deal UUID format")

    deal = db.query(Deal).filter(Deal.id == deal_uuid).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=f"Negotiation style can only be updated for active agent environments. Current environment state is {deal.status}."
        )

    style = payload.negotiation_style.upper().strip()
    if style not in ["DISTRIBUTIVE", "INTEGRATIVE"]:
        raise HTTPException(status_code=400, detail="Negotiation style must be DISTRIBUTIVE or INTEGRATIVE")

    deal.negotiation_style = style
    
    # Broadcast/timeline message
    sys_msg = Message(
        id=uuid.uuid4(),
        deal_id=deal_uuid,
        sender_name="System Settlement",
        role="SYSTEM",
        message_text=f"[System Settlement | SYSTEM]: Dynamic style swapped to {style}. Strategies re-aligned."
    )
    db.add(sys_msg)
    db.commit()

    return {
        "status": "SUCCESS_STYLE_UPDATED",
        "deal_id": str(deal_uuid),
        "negotiation_style": style
    }

@app.post("/api/deals/ingest")
def ingest_deal(payload: DealIngestRequest, db: Session = Depends(get_db)):
    """
    Ingests an unstructured raw text RFQ layout or email, routes it through Fastino's task-optimized parsing
    or image VLM (fal-ai/bagel/understand) if an image URL is detected,
    searches live marketplace price references using Tavily, creates a new active Buyer-perspective Deal,
    seeds both participants, triggers Pioneer trace logging, and commits the records to PostgreSQL.
    """
    raw_text = payload.raw_text.strip()
    is_image = False
    if raw_text.startswith("http://") or raw_text.startswith("https://"):
        lower_url = raw_text.lower()
        if any(lower_url.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif"]):
            is_image = True

    if is_image:
        print(f"[TRACK 2] Image URL detected. Routing to Fal.ai Bagel VLM: {raw_text}")
        ingest_data = ingest_image_rfq_via_fal_bagel(raw_text)
    else:
        print("[TRACK 2] Pure text detected. Routing to Fastino unstructured parser.")
        ingest_data = ingest_unstructured_rfq_with_fastino(raw_text)

    item_name = ingest_data["item_name"]
    budget_cap = ingest_data["recommended_budget_cap"]
    extracted_specs = ingest_data["extracted_specs"]
    
    # 2. Run market research grounding using Tavily + Gemini formatting
    market_report = search_market_valuation_benchmarks(item_name)
    
    # 3. Combine extracted specifications and market reports
    header_prefix = f"EXTRACTED VIA {'FAL-AI BAGEL UNDERSTAND' if is_image else 'FASTINO'}"
    combined_specs = (
        f"# TECHNICAL HARDWARE SPECIFICATIONS ({header_prefix}):\n\n"
        f"{extracted_specs}\n\n"
        f"==================================================\n\n"
        f"{market_report}"
    )
    
    # 4. Spawn a new Deal row
    deal_id = uuid.uuid4()
    new_deal = Deal(
        id=deal_id,
        item_name=item_name,
        status="ACTIVE",
        current_buyer_budget=budget_cap,
        technical_specs=combined_specs,
        perspective="BUYER",
        negotiation_style="DISTRIBUTIVE"
    )
    db.add(new_deal)
    
    # 5. Provision isolated Participant records (Buyer Agent and Seller Agent)
    participants_seed = [
        Participant(
            id=uuid.uuid4(),
            deal_id=deal_id,
            name="Buyer Agent",
            role="BUYER",
            current_price_point=int(budget_cap * 0.7),  # starting bid
            hidden_floor_ceil=budget_cap
        ),
        Participant(
            id=uuid.uuid4(),
            deal_id=deal_id,
            name="Seller Agent",
            role="SELLER",
            current_price_point=int(budget_cap * 1.15),  # starting ask
            hidden_floor_ceil=int(budget_cap * 0.85)  # floor limit
        )
    ]
    
    for p in participants_seed:
        db.add(p)
        
    # 6. Append initial Message timeline traces using professional pipes (|) system formatting
    announcements = [
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"SYSTEM | MULTIMODAL RFQ INGESTION COMPLETE | LOT: '{item_name.upper()}' | PARSER: {'FAL-AI BAGEL UNDERSTAND' if is_image else 'FASTINO-POWERED'}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"SYSTEM | TAVILY GROUNDING INTEGRATED | SPECIFICATIONS AND BENCHMARKS:\n{combined_specs}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="SYSTEM | ORCHESTRATION ACTIVE | BUYER-PERSPECTIVE EXCHANGE ARMED (Counter-Offers trigger Seller Agent turns)."
        )
    ]
    
    for msg in announcements:
        db.add(msg)
        
    db.commit()
    
    # 7. Pioneer Observability Log Trace
    transcript_mock = [{"sender": a.sender_name, "role": a.role, "text": a.message_text} for a in announcements]
    log_trace_to_fastino_pioneer(deal_id=str(deal_id), transcript=transcript_mock)
    
    return {"status": "SUCCESS", "deal_id": str(deal_id)}

@app.post("/api/deals/ingest-file")
async def ingest_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Accepts multipart document or image upload. Parses text locally for office/pdf docs,
    or executes image OCR/parsing via fal.ai VLM. Then runs Tavily research,
    seeds participants, logs system messages and Pioneer traces, and commits to Postgres.
    """
    import base64
    filename = file.filename
    content_type = file.content_type
    file_bytes = await file.read()
    
    # 1. Determine parsing strategy based on file extension / content type
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    is_image = ext in ["png", "jpg", "jpeg", "webp", "gif"] or (content_type and content_type.startswith("image/"))
    
    if is_image:
        # Convert file bytes to base64 data URI to pass to fal.ai VLM
        mime = content_type or f"image/{ext}" if ext else "image/png"
        b64_str = base64.b64encode(file_bytes).decode("utf-8")
        data_uri = f"data:{mime};base64,{b64_str}"
        
        # Invoke fal.ai vision model
        ingest_data = extract_rfq_from_image_via_fal(data_uri)
    else:
        # Document formats: PDF, DOCX, XLSX, TXT
        try:
            raw_text = extract_text_from_file_bytes(file_bytes, filename)
            # Use task-optimized Fastino model route to extract details
            ingest_data = ingest_unstructured_rfq_with_fastino(raw_text)
        except Exception as err:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse document: {str(err)}"
            )
            
    item_name = ingest_data["item_name"]
    budget_cap = ingest_data["recommended_budget_cap"]
    extracted_specs = ingest_data["extracted_specs"]
    
    # 2. Run market research grounding using Tavily + Gemini formatting
    market_report = search_market_valuation_benchmarks(item_name)
    
    # 3. Combine extracted specifications and market reports
    combined_specs = (
        f"# TECHNICAL HARDWARE SPECIFICATIONS (EXTRACTED FROM {filename.upper()}):\n\n"
        f"{extracted_specs}\n\n"
        f"==================================================\n\n"
        f"{market_report}"
    )
    
    # 4. Spawn a new Deal row
    deal_id = uuid.uuid4()
    new_deal = Deal(
        id=deal_id,
        item_name=item_name,
        status="ACTIVE",
        current_buyer_budget=budget_cap,
        technical_specs=combined_specs,
        perspective="BUYER",
        negotiation_style="DISTRIBUTIVE"
    )
    db.add(new_deal)
    
    # 5. Provision isolated Participant records
    participants_seed = [
        Participant(
            id=uuid.uuid4(),
            deal_id=deal_id,
            name="Buyer (You)",
            role="BUYER",
            current_price_point=int(budget_cap * 0.7),  # starting bid
            hidden_floor_ceil=budget_cap
        ),
        Participant(
            id=uuid.uuid4(),
            deal_id=deal_id,
            name="Seller Agent",
            role="SELLER",
            current_price_point=int(budget_cap * 1.15),  # starting ask
            hidden_floor_ceil=int(budget_cap * 0.85)  # floor limit
        )
    ]
    
    for p in participants_seed:
        db.add(p)
        
    # 6. Append initial Message timeline traces with upload metadata
    announcements = [
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=(
                f"DOCUMENT INGESTION PROTOCOL INITIATED FOR ASSET FILE: '{filename.upper()}'.\n"
                f"PARSING TECHNIQUE: {'FAL.AI VLM OCR' if is_image else 'LOCAL EXTRACTION + FASTINO PARSING'}.\n"
                f"IDENTIFIED LOT DESCRIPTOR: '{item_name.upper()}'."
            )
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"TAVILY & GROUNDED SPECIFICATIONS REPORT:\n{combined_specs}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=deal_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="BUYER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE BUYER (Counter-Offers trigger Seller Agent turns)."
        )
    ]
    
    for msg in announcements:
        db.add(msg)
        
    db.commit()
    
    # 7. Pioneer Observability Log Trace
    transcript_mock = [{"sender": a.sender_name, "role": a.role, "text": a.message_text} for a in announcements]
    log_trace_to_fastino_pioneer(deal_id=str(deal_id), transcript=transcript_mock)
    
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
            chat_history=chat_history,
            negotiation_style=deal.negotiation_style
        )
        
        # Save positions to participant ledger
        p.current_price_point = turn_data["price_point"]
        
        price_point = turn_data.get("price_point", p.current_price_point)
        warranty = turn_data.get("proposed_warranty_years", 1)
        payment = turn_data.get("proposed_payment_terms", "Net 30")
        sla = turn_data.get("proposed_sla_uptime", "99.0%")
        msg_body = turn_data.get("message", "").strip()
        
        formatted_message = f"[Offer: {price_point} EUR | {warranty}Yr Warranty | {payment} | SLA: {sla}] {msg_body}"
        
        # Save message transcript to the unified deal timeline
        new_msg = Message(
            id=uuid.uuid4(),
            deal_id=deal_uuid,
            sender_name=p.name,
            role=p.role,
            message_text=formatted_message
        )
        db.add(new_msg)
        db.flush() # Ensure database is up-to-date with this message for subsequent turns
        
        # Append to active runtime chat history array for the subsequent participant in loop
        chat_history.append({
            "sender": p.name,
            "role": p.role,
            "text": formatted_message
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
        
        # Trigger Pioneer Observability fine-tuning logs for Deadlock Anomaly
        try:
            full_msgs = db.query(Message).filter(Message.deal_id == deal_uuid).order_by(Message.timestamp.asc()).all()
            transcript_list = [{"sender": m.sender_name, "role": m.role, "text": m.message_text} for m in full_msgs]
            log_trace_to_fastino_pioneer(deal_id=str(deal_uuid), transcript=transcript_list, failure_mode="DEADLOCK")
        except Exception as logger_err:
            print(f"Failed to log Pioneer deadlock trace: {logger_err}")
            
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
