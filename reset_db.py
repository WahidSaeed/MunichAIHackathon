import os
import uuid
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Load env variables first
load_dotenv(override=True)

from backend.database import engine, Base
from backend.models import Deal, Participant, Message
from backend.agents import run_market_intelligence

print("Resetting database...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Database reset successfully.")

print("Seeding default dual-perspective B2B Lots...")

with Session(bind=engine) as session:
    # 1. Seed BUYER PERSPECTIVE LOT
    print("Seeding Lot 1: Inconel 718 Turbine Blades [BUYER PERSPECTIVE]...")
    lot_1_id = uuid.uuid4()
    
    # Run market intelligence for Lot 1
    lot_1_intel = run_market_intelligence("Inconel 718 Turbine Blades")
    
    lot_1_deal = Deal(
        id=lot_1_id,
        item_name="Inconel 718 Turbine Blades",
        status="ACTIVE",
        current_buyer_budget=1200,
        technical_specs=lot_1_intel,
        perspective="BUYER"
    )
    session.add(lot_1_deal)
    
    # Participants for Lot 1: You (Buyer) and AI Seller Agent
    lot_1_parts = [
        Participant(
            id=uuid.uuid4(),
            deal_id=lot_1_id,
            name="Buyer (You)",
            role="BUYER",
            current_price_point=850,
            hidden_floor_ceil=1200
        ),
        Participant(
            id=uuid.uuid4(),
            deal_id=lot_1_id,
            name="Seller Agent",
            role="SELLER",
            current_price_point=1350,
            hidden_floor_ceil=1050
        )
    ]
    for p in lot_1_parts:
        session.add(p)
        
    # Announcements for Lot 1
    lot_1_msgs = [
        Message(
            id=uuid.uuid4(),
            deal_id=lot_1_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="DEAL ENVIRONMENT REGISTERED FOR LOT 'INCONEL 718 TURBINE BLADES'."
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=lot_1_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"TAVILY CONTEXT INJECTED:\n{lot_1_intel}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=lot_1_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="BUYER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE BUYER (Counter-Offers trigger Seller Agent turns)."
        )
    ]
    for m in lot_1_msgs:
        session.add(m)
        
    # 2. Seed SELLER PERSPECTIVE LOT
    print("Seeding Lot 2: Titanium Rotor Assembly [SELLER PERSPECTIVE]...")
    lot_2_id = uuid.uuid4()
    
    # Run market intelligence for Lot 2
    lot_2_intel = run_market_intelligence("Titanium Rotor Assembly")
    
    lot_2_deal = Deal(
        id=lot_2_id,
        item_name="Titanium Rotor Assembly",
        status="ACTIVE",
        current_buyer_budget=2000,
        technical_specs=lot_2_intel,
        perspective="SELLER"
    )
    session.add(lot_2_deal)
    
    # Participants for Lot 2: AI Buyer Agent and You (Seller)
    lot_2_parts = [
        Participant(
            id=uuid.uuid4(),
            deal_id=lot_2_id,
            name="Buyer Agent",
            role="BUYER",
            current_price_point=1500,
            hidden_floor_ceil=2000
        ),
        Participant(
            id=uuid.uuid4(),
            deal_id=lot_2_id,
            name="Seller (You)",
            role="SELLER",
            current_price_point=2300,
            hidden_floor_ceil=1700
        )
    ]
    for p in lot_2_parts:
        session.add(p)
        
    # Announcements for Lot 2
    lot_2_msgs = [
        Message(
            id=uuid.uuid4(),
            deal_id=lot_2_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="DEAL ENVIRONMENT REGISTERED FOR LOT 'TITANIUM ROTOR ASSEMBLY'."
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=lot_2_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text=f"TAVILY CONTEXT INJECTED:\n{lot_2_intel}"
        ),
        Message(
            id=uuid.uuid4(),
            deal_id=lot_2_id,
            sender_name="System Settlement",
            role="SYSTEM",
            message_text="SELLER-PERSPECTIVE EXCHANGE ARMED. YOU ARE THE SELLER (Counter-Offers trigger Buyer Agent turns)."
        )
    ]
    for m in lot_2_msgs:
        session.add(m)
        
    session.commit()
    print("Seeding complete.")
