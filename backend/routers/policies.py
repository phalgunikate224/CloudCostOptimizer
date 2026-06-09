from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import CostRecord, Policy

router = APIRouter(prefix="/api/policies", tags=["policies"])


class PolicyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    cloud: str = Field(..., pattern="^(AWS|Azure|GCP|All)$")
    condition: str = Field(default="cost > threshold")
    threshold: float = Field(..., gt=0)
    action: str = Field(..., pattern="^(Alert|Pause|Scale Down)$")


class PolicyUpdate(BaseModel):
    is_active: bool


@router.post("/create")
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    today = date.today()
    triggered = False

    if policy.cloud != "All":
        today_cost = (
            db.query(CostRecord)
            .filter(CostRecord.cloud == policy.cloud, CostRecord.date == today)
            .all()
        )
        daily_total = sum(r.cost for r in today_cost)
        triggered = daily_total > policy.threshold
    else:
        for cloud in ["AWS", "Azure", "GCP"]:
            today_cost = (
                db.query(CostRecord)
                .filter(CostRecord.cloud == cloud, CostRecord.date == today)
                .all()
            )
            if sum(r.cost for r in today_cost) > policy.threshold:
                triggered = True
                break

    new_policy = Policy(
        name=policy.name,
        cloud=policy.cloud,
        condition=policy.condition,
        threshold=policy.threshold,
        action=policy.action,
        is_active=True,
        triggered_today=triggered,
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    return {
        "message": "Policy created successfully",
        "policy": {
            "id": new_policy.id,
            "name": new_policy.name,
            "cloud": new_policy.cloud,
            "condition": new_policy.condition,
            "threshold": new_policy.threshold,
            "action": new_policy.action,
            "is_active": new_policy.is_active,
            "triggered_today": new_policy.triggered_today,
        },
    }


@router.get("/list")
def list_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).order_by(Policy.created_at.desc()).all()
    return {
        "policies": [
            {
                "id": p.id,
                "name": p.name,
                "cloud": p.cloud,
                "condition": p.condition,
                "threshold": p.threshold,
                "action": p.action,
                "is_active": p.is_active,
                "triggered_today": p.triggered_today,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in policies
        ]
    }


@router.patch("/{policy_id}/toggle")
def toggle_policy(policy_id: int, update: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    policy.is_active = update.is_active
    db.commit()
    return {"message": "Policy updated", "is_active": policy.is_active}


@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted successfully"}
