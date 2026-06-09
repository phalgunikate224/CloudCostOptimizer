from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from ml.anomaly_detector import anomaly_frequency_by_service, detect_anomalies
from models import CostRecord

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


@router.get("/detect")
def detect_cost_anomalies(
    cloud: Optional[str] = Query(None),
    days: int = Query(90, ge=30, le=180),
    db: Session = Depends(get_db),
):
    from datetime import date, timedelta

    start_date = date.today() - timedelta(days=days)
    query = db.query(CostRecord).filter(CostRecord.date >= start_date)
    if cloud:
        query = query.filter(CostRecord.cloud == cloud)

    records = query.order_by(CostRecord.date).all()
    anomalies = detect_anomalies(records, cloud_filter=cloud)
    frequency = anomaly_frequency_by_service(anomalies)

    high_severity = [a for a in anomalies if a["severity"] == "high"]
    medium_severity = [a for a in anomalies if a["severity"] == "medium"]
    low_severity = [a for a in anomalies if a["severity"] == "low"]

    return {
        "total": len(anomalies),
        "high_severity_count": len(high_severity),
        "medium_severity_count": len(medium_severity),
        "low_severity_count": len(low_severity),
        "has_high_severity": len(high_severity) > 0,
        "anomalies": anomalies,
        "frequency_by_service": frequency,
    }
