from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Recommendation

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


class ApplyRecommendationRequest(BaseModel):
    recommendation_id: int


@router.get("/list")
def list_recommendations(
    applied: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Recommendation)
    if applied is not None:
        query = query.filter(Recommendation.is_applied == applied)

    recommendations = query.order_by(Recommendation.estimated_savings.desc()).all()

    total_available = sum(
        r.estimated_savings for r in recommendations if not r.is_applied
    )
    total_applied = sum(
        r.estimated_savings for r in recommendations if r.is_applied
    )

    return {
        "total_savings_available": round(total_available, 2),
        "total_savings_applied": round(total_applied, 2),
        "recommendations": [
            {
                "id": r.id,
                "resource_name": r.resource_name,
                "cloud": r.cloud,
                "issue": r.issue,
                "recommended_action": r.recommended_action,
                "estimated_savings": round(r.estimated_savings, 2),
                "roi": r.roi,
                "is_applied": r.is_applied,
            }
            for r in recommendations
        ],
    }


@router.post("/apply")
def apply_recommendation(
    request: ApplyRecommendationRequest,
    db: Session = Depends(get_db),
):
    rec = db.query(Recommendation).filter(Recommendation.id == request.recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.is_applied = True
    db.commit()
    db.refresh(rec)

    remaining = sum(
        r.estimated_savings
        for r in db.query(Recommendation).filter(Recommendation.is_applied == False).all()
    )

    return {
        "message": "Recommendation applied successfully",
        "recommendation_id": rec.id,
        "estimated_savings": round(rec.estimated_savings, 2),
        "total_savings_available": round(remaining, 2),
    }
