from datetime import datetime, date

from sqlalchemy import Boolean, Column, Date, DateTime, Float, Integer, String, Text

from database import Base


class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    cloud = Column(String(20), nullable=False, index=True)
    service = Column(String(50), nullable=False, index=True)
    cost = Column(Float, nullable=False)


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    cloud = Column(String(20), nullable=False)
    condition = Column(String(200), nullable=False)
    threshold = Column(Float, nullable=False)
    action = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    triggered_today = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String(150), nullable=False)
    cloud = Column(String(20), nullable=False)
    issue = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    estimated_savings = Column(Float, nullable=False)
    roi = Column(String(20), nullable=False)
    is_applied = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
