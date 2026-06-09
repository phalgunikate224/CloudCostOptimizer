import random
from datetime import date, timedelta

import numpy as np
from sqlalchemy.orm import Session

from models import CostRecord, Recommendation

CLOUDS = ["AWS", "Azure", "GCP"]
SERVICES = ["Compute", "Storage", "Network", "Database", "AI/ML"]

BASE_COSTS = {
    "AWS": {
        "Compute": 120.0,
        "Storage": 45.0,
        "Network": 30.0,
        "Database": 55.0,
        "AI/ML": 25.0,
    },
    "Azure": {
        "Compute": 110.0,
        "Storage": 42.0,
        "Network": 28.0,
        "Database": 50.0,
        "AI/ML": 22.0,
    },
    "GCP": {
        "Compute": 105.0,
        "Storage": 40.0,
        "Network": 26.0,
        "Database": 48.0,
        "AI/ML": 30.0,
    },
}


def _daily_cost(base: float, day: date, day_index: int) -> float:
    weekday = day.weekday()
    is_weekend = weekday >= 5

    weekday_factor = 1.0 if not is_weekend else 0.72
    weekend_drop = 0.72 if is_weekend else 1.0

    day_of_month = day.day
    if day_of_month >= 25:
        monthly_peak = 1.15 + (day_of_month - 25) * 0.02
    elif day_of_month <= 5:
        monthly_peak = 1.08
    else:
        monthly_peak = 1.0

    trend = 1.0 + (day_index / 180) * 0.12
    noise = random.uniform(0.92, 1.08)
    seasonal = 1.0 + 0.05 * np.sin(2 * np.pi * day_index / 30)

    cost = base * weekday_factor * weekend_drop * monthly_peak * trend * noise * seasonal
    return round(max(cost, 1.0), 2)


def generate_cost_records(db: Session, months: int = 6) -> int:
    end_date = date.today()
    start_date = end_date - timedelta(days=months * 30)
    records = []
    day_index = 0
    current = start_date

    while current <= end_date:
        for cloud in CLOUDS:
            for service in SERVICES:
                base = BASE_COSTS[cloud][service]
                cost = _daily_cost(base, current, day_index)
                records.append(
                    CostRecord(
                        date=current,
                        cloud=cloud,
                        service=service,
                        cost=cost,
                    )
                )
        current += timedelta(days=1)
        day_index += 1

    db.bulk_save_objects(records)
    db.commit()
    return len(records)


def seed_recommendations(db: Session) -> int:
    recommendations = [
        Recommendation(
            resource_name="i-0a3f8b2c1d4e5f6a7",
            cloud="AWS",
            issue="Underutilized EC2 instance (avg CPU 8%)",
            recommended_action="Downsize from m5.xlarge to m5.large or use Savings Plans",
            estimated_savings=342.50,
            roi="High",
        ),
        Recommendation(
            resource_name="prod-sql-server-01",
            cloud="Azure",
            issue="Azure SQL Database over-provisioned (DTU utilization 22%)",
            recommended_action="Switch to General Purpose tier with auto-scaling",
            estimated_savings=218.00,
            roi="High",
        ),
        Recommendation(
            resource_name="gke-cluster-prod",
            cloud="GCP",
            issue="GKE nodes running 24/7 with low evening utilization",
            recommended_action="Enable cluster autoscaler and node pool autoscaling",
            estimated_savings=456.75,
            roi="High",
        ),
        Recommendation(
            resource_name="s3-glacier-archive",
            cloud="AWS",
            issue="Standard storage tier used for infrequently accessed data",
            recommended_action="Migrate to S3 Intelligent-Tiering or Glacier",
            estimated_savings=127.30,
            roi="Medium",
        ),
        Recommendation(
            resource_name="azure-blob-hot-tier",
            cloud="Azure",
            issue="Hot tier storage for backup data accessed monthly",
            recommended_action="Move to Cool or Archive tier with lifecycle policy",
            estimated_savings=89.50,
            roi="Medium",
        ),
        Recommendation(
            resource_name="cloud-cdn-egress",
            cloud="GCP",
            issue="High network egress costs from multi-region replication",
            recommended_action="Consolidate to single region with Cloud CDN caching",
            estimated_savings=312.00,
            roi="High",
        ),
        Recommendation(
            resource_name="rds-multi-az-dev",
            cloud="AWS",
            issue="Multi-AZ RDS instance for non-production environment",
            recommended_action="Disable Multi-AZ for dev/staging or use Aurora Serverless",
            estimated_savings=175.00,
            roi="Medium",
        ),
        Recommendation(
            resource_name="vertex-ai-endpoint",
            cloud="GCP",
            issue="Always-on ML endpoint with sporadic inference traffic",
            recommended_action="Switch to batch prediction or scale-to-zero endpoint",
            estimated_savings=198.25,
            roi="Medium",
        ),
    ]
    db.bulk_save_objects(recommendations)
    db.commit()
    return len(recommendations)


def initialize_database(db: Session) -> dict:
    cost_count = db.query(CostRecord).count()
    if cost_count == 0:
        cost_count = generate_cost_records(db)

    rec_count = db.query(Recommendation).count()
    if rec_count == 0:
        rec_count = seed_recommendations(db)

    return {"cost_records": cost_count, "recommendations": rec_count}
