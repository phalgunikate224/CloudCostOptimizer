from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from ml.forecaster import forecast_all_clouds, forecast_costs, generate_insights
from models import CostRecord

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/forecast")
def get_forecast(
    cloud: Optional[str] = Query(None),
    forecast_days: int = Query(30, ge=7, le=90),
    lookback_days: int = Query(60, ge=14, le=180),
    db: Session = Depends(get_db),
):
    start_date = date.today() - timedelta(days=lookback_days)

    if cloud:
        records = (
            db.query(CostRecord)
            .filter(CostRecord.cloud == cloud, CostRecord.date >= start_date)
            .order_by(CostRecord.date)
            .all()
        )
        historical = [
            {
                "date": r.date.isoformat(),
                "cost": round(r.cost, 2),
            }
            for r in records
        ]
        daily_totals = {}
        for r in records:
            key = r.date.isoformat()
            daily_totals[key] = daily_totals.get(key, 0) + r.cost
        historical_daily = [
            {"date": k, "cost": round(v, 2)} for k, v in sorted(daily_totals.items())
        ]

        predictions = forecast_costs(
            records,
            forecast_days=forecast_days,
            lookback_days=lookback_days,
            cloud=cloud,
        )
        hist_avg = (
            sum(d["cost"] for d in historical_daily) / len(historical_daily)
            if historical_daily
            else 0
        )
        insights = generate_insights(predictions, hist_avg)

        return {
            "cloud": cloud,
            "historical": historical_daily,
            "predictions": predictions,
            "insights": insights,
            "forecast_days": forecast_days,
        }

    records_by_cloud = {}
    for c in ["AWS", "Azure", "GCP"]:
        cloud_records = (
            db.query(CostRecord)
            .filter(CostRecord.cloud == c, CostRecord.date >= start_date)
            .order_by(CostRecord.date)
            .all()
        )
        records_by_cloud[c] = cloud_records

    all_predictions = forecast_all_clouds(records_by_cloud, forecast_days=forecast_days)

    combined_historical = {}
    for c, recs in records_by_cloud.items():
        for r in recs:
            key = r.date.isoformat()
            if key not in combined_historical:
                combined_historical[key] = 0.0
            combined_historical[key] += r.cost

    historical_daily = [
        {"date": k, "cost": round(v, 2)} for k, v in sorted(combined_historical.items())
    ]

    combined_predictions = []
    for day_offset in range(forecast_days):
        day_preds = [all_predictions[c][day_offset] for c in ["AWS", "Azure", "GCP"]]
        combined = {
            "date": day_preds[0]["date"],
            "predicted_cost": round(
                sum(p["predicted_cost"] for p in day_preds), 2
            ),
            "confidence_interval": {
                "lower": round(sum(p["confidence_interval"]["lower"] for p in day_preds), 2),
                "upper": round(sum(p["confidence_interval"]["upper"] for p in day_preds), 2),
            },
        }
        combined_predictions.append(combined)

    hist_avg = (
        sum(d["cost"] for d in historical_daily) / len(historical_daily)
        if historical_daily
        else 0
    )
    insights = generate_insights(combined_predictions, hist_avg)

    return {
        "cloud": "All",
        "historical": historical_daily,
        "predictions": combined_predictions,
        "predictions_by_cloud": all_predictions,
        "insights": insights,
        "forecast_days": forecast_days,
    }
