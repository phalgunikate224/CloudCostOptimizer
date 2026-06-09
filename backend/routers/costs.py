from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import CostRecord

router = APIRouter(prefix="/api/costs", tags=["costs"])


@router.get("/summary")
def get_cost_summary(db: Session = Depends(get_db)):
    today = date.today()
    first_of_month = today.replace(day=1)
    if today.month == 1:
        first_of_last_month = date(today.year - 1, 12, 1)
        last_of_last_month = date(today.year - 1, 12, 31)
    else:
        first_of_last_month = date(today.year, today.month - 1, 1)
        last_of_last_month = first_of_month - timedelta(days=1)

    this_month = (
        db.query(CostRecord.cloud, func.sum(CostRecord.cost).label("total"))
        .filter(CostRecord.date >= first_of_month, CostRecord.date <= today)
        .group_by(CostRecord.cloud)
        .all()
    )

    last_month = (
        db.query(CostRecord.cloud, func.sum(CostRecord.cost).label("total"))
        .filter(
            CostRecord.date >= first_of_last_month,
            CostRecord.date <= last_of_last_month,
        )
        .group_by(CostRecord.cloud)
        .all()
    )

    last_month_map = {r.cloud: float(r.total) for r in last_month}
    clouds = []
    grand_total = 0.0
    last_grand_total = 0.0

    for row in this_month:
        total = float(row.total)
        last_total = last_month_map.get(row.cloud, 0.0)
        change_pct = ((total - last_total) / last_total * 100) if last_total > 0 else 0.0
        clouds.append(
            {
                "cloud": row.cloud,
                "total_spend": round(total, 2),
                "last_month_spend": round(last_total, 2),
                "change_percent": round(change_pct, 2),
            }
        )
        grand_total += total
        last_grand_total += last_total

    overall_change = (
        ((grand_total - last_grand_total) / last_grand_total * 100)
        if last_grand_total > 0
        else 0.0
    )

    return {
        "period": {"start": first_of_month.isoformat(), "end": today.isoformat()},
        "clouds": clouds,
        "total_spend": round(grand_total, 2),
        "last_month_total": round(last_grand_total, 2),
        "overall_change_percent": round(overall_change, 2),
    }


@router.get("/breakdown")
def get_cost_breakdown(
    days: int = Query(30, ge=1, le=180),
    cloud: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    start_date = date.today() - timedelta(days=days)

    query = db.query(CostRecord).filter(CostRecord.date >= start_date)
    if cloud:
        query = query.filter(CostRecord.cloud == cloud)

    records = query.order_by(CostRecord.date).all()
    total_cost = sum(r.cost for r in records)

    daily = {}
    for r in records:
        key = r.date.isoformat()
        if key not in daily:
            daily[key] = {"date": key, "clouds": {}, "total": 0.0}
        if r.cloud not in daily[key]["clouds"]:
            daily[key]["clouds"][r.cloud] = {}
        daily[key]["clouds"][r.cloud][r.service] = round(
            daily[key]["clouds"][r.cloud].get(r.service, 0) + r.cost, 2
        )
        daily[key]["total"] = round(daily[key]["total"] + r.cost, 2)

    table_rows = []
    for r in records:
        pct = (r.cost / total_cost * 100) if total_cost > 0 else 0
        table_rows.append(
            {
                "date": r.date.isoformat(),
                "cloud": r.cloud,
                "service": r.service,
                "cost": round(r.cost, 2),
                "percent_of_total": round(pct, 2),
            }
        )

    return {
        "days": days,
        "total_cost": round(total_cost, 2),
        "daily": list(daily.values()),
        "records": table_rows,
    }


@router.get("/multicloud")
def get_multicloud_comparison(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
):
    start_date = date.today() - timedelta(days=months * 30)

    records = (
        db.query(
            func.strftime("%Y-%m", CostRecord.date).label("month"),
            CostRecord.cloud,
            func.sum(CostRecord.cost).label("total"),
        )
        .filter(CostRecord.date >= start_date)
        .group_by("month", CostRecord.cloud)
        .order_by("month")
        .all()
    )

    months_set = sorted(set(r.month for r in records))
    data = []
    for month in months_set:
        entry = {"month": month, "AWS": 0.0, "Azure": 0.0, "GCP": 0.0}
        for r in records:
            if r.month == month:
                entry[r.cloud] = round(float(r.total), 2)
        data.append(entry)

    totals = {"AWS": 0.0, "Azure": 0.0, "GCP": 0.0}
    for entry in data:
        for cloud in ["AWS", "Azure", "GCP"]:
            totals[cloud] += entry[cloud]

    return {
        "months": months,
        "monthly_data": data,
        "totals": {k: round(v, 2) for k, v in totals.items()},
    }


@router.get("/daily-trend")
def get_daily_trend(
    days: int = Query(30, ge=1, le=180),
    db: Session = Depends(get_db),
):
    start_date = date.today() - timedelta(days=days)

    records = (
        db.query(
            CostRecord.date,
            func.sum(CostRecord.cost).label("total"),
        )
        .filter(CostRecord.date >= start_date)
        .group_by(CostRecord.date)
        .order_by(CostRecord.date)
        .all()
    )

    return {
        "days": days,
        "data": [
            {"date": r.date.isoformat(), "cost": round(float(r.total), 2)}
            for r in records
        ],
    }


@router.get("/service-breakdown")
def get_service_breakdown(
    days: int = Query(30, ge=1, le=180),
    db: Session = Depends(get_db),
):
    start_date = date.today() - timedelta(days=days)

    records = (
        db.query(
            CostRecord.service,
            func.sum(CostRecord.cost).label("total"),
        )
        .filter(CostRecord.date >= start_date)
        .group_by(CostRecord.service)
        .all()
    )

    return {
        "days": days,
        "data": [
            {"service": r.service, "cost": round(float(r.total), 2)}
            for r in records
        ],
    }
