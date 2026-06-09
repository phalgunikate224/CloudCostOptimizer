from typing import List, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


def _severity(deviation_percent: float) -> str:
    abs_dev = abs(deviation_percent)
    if abs_dev >= 40:
        return "high"
    if abs_dev >= 20:
        return "medium"
    return "low"


def detect_anomalies(
    records: list,
    contamination: float = 0.05,
    cloud_filter: Optional[str] = None,
) -> List[dict]:
    if not records:
        return []

    df = pd.DataFrame(
        [
            {
                "date": r.date,
                "cloud": r.cloud,
                "service": r.service,
                "cost": r.cost,
            }
            for r in records
        ]
    )

    if cloud_filter:
        df = df[df["cloud"] == cloud_filter]

    if df.empty:
        return []

    anomalies = []

    for (cloud, service), group in df.groupby(["cloud", "service"]):
        group = group.sort_values("date").reset_index(drop=True)
        if len(group) < 14:
            continue

        costs = group["cost"].values.reshape(-1, 1)
        expected = group["cost"].rolling(window=7, min_periods=1).mean().values

        model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
        )
        predictions = model.fit_predict(costs)
        scores = model.decision_function(costs)

        for idx, row in group.iterrows():
            if predictions[idx] == -1:
                actual = float(row["cost"])
                exp = float(expected[idx]) if expected[idx] > 0 else float(np.mean(costs))
                if exp == 0:
                    exp = float(np.mean(costs))

                deviation = ((actual - exp) / exp) * 100
                severity = _severity(deviation)

                anomalies.append(
                    {
                        "date": row["date"].isoformat() if hasattr(row["date"], "isoformat") else str(row["date"]),
                        "cloud": cloud,
                        "service": service,
                        "actual_cost": round(actual, 2),
                        "expected_cost": round(exp, 2),
                        "deviation_percent": round(deviation, 2),
                        "severity": severity,
                        "anomaly_score": round(float(scores[idx]), 4),
                    }
                )

    severity_order = {"high": 0, "medium": 1, "low": 2}
    anomalies.sort(
        key=lambda a: (severity_order.get(a["severity"], 3), -abs(a["deviation_percent"]))
    )
    return anomalies


def anomaly_frequency_by_service(anomalies: List[dict]) -> List[dict]:
    if not anomalies:
        return []

    freq = {}
    for a in anomalies:
        key = a["service"]
        freq[key] = freq.get(key, 0) + 1

    return [{"service": k, "count": v} for k, v in sorted(freq.items(), key=lambda x: -x[1])]
