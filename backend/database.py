import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# We use the psycopg v3 dialect 'postgresql+psycopg' which has cp314 wheels
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:mysecretpassword@localhost:5432/atira_procurement"
)

# Configure SQLAlchemy engine with connection pool parameters
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Thread-safe context manager yielding a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
