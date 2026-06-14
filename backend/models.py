import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base

class Deal(Base):
    __tablename__ = "deals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE") # ACTIVE, MATCHED, DEADLOCK, TERMINATED
    current_buyer_budget = Column(Integer, nullable=True)
    technical_specs = Column(Text, nullable=True)
    perspective = Column(String(50), nullable=True) # BUYER or SELLER
    negotiation_style = Column(String(50), nullable=False, default="DISTRIBUTIVE") # DISTRIBUTIVE or INTEGRATIVE
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    participants = relationship("Participant", back_populates="deal", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="deal", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # BUYER, SELLER
    current_price_point = Column(Integer, nullable=True)
    hidden_floor_ceil = Column(Integer, nullable=False) # Budget Cap for BUYER, Floor Price for SELLER

    deal = relationship("Deal", back_populates="participants")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    sender_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # BUYER, SELLER, SYSTEM, OPERATOR
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    deal = relationship("Deal", back_populates="messages")
