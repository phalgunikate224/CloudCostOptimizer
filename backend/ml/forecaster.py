from datetime import date, timedelta
from typing import List, Optional

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def _prepare_series(records: list, lookback_days: int = 60) -> pd.DataFrame:
    df = pd.DataFrame(
        [{"date": r.date, "cost": r.cost} for r in records]
    )
    if df.empty:
        return df

    df["date"] = pd.to_datetime(df["date"])
    df = df.groupby("date", as_index=False)["cost"].sum()
    df = df.sort_values("date").tail(lookback_days)
    return df


def forecast_costs(
    records: list,
    forecast_days: int = 30,
    lookback_days: int = 60,
    cloud: Optional[str] = None,
) -> List[dict]:
    df = _prepare_series(records, lookback_days)

    if len(df) < 7:
        return []

    df = df.reset_index(drop=True)
    df["day_index"] = np.arange(len(df))

    X = df[["day_index"]].values
    y = df["cost"].values

    lr_model = LinearRegression()
    lr_model.fit(X, y)

    residuals = y - lr_model.predict(X)
    std_error = float(np.std(residuals)) if len(residuals) > 1 else float(np.mean(y) * 0.1)

    hw_forecasts = []
    if len(df) >= 14:
        try:
            ts = df.set_index("date")["cost"]
            hw_model = ExponentialSmoothing(
                ts,
                trend="add",
                seasonal=None,
                initialization_method="estimated",
            )
            hw_fit = hw_model.fit(optimized=True)
            hw_forecasts = hw_fit.forecast(forecast_days).tolist()
        except Exception:
            hw_forecasts = []

    last_date = df["date"].max().date()
    last_index = len(df) - 1

    predictions = []
    for i in range(1, forecast_days + 1):
        future_index = last_index + i
        future_date = last_date + timedelta(days=i)

        lr_pred = float(lr_model.predict([[future_index]])[0])

        if hw_forecasts and i - 1 < len(hw_forecasts):
            hw_pred = float(hw_forecasts[i - 1])
            predicted_cost = round((lr_pred * 0.4 + hw_pred * 0.6), 2)
        else:
            predicted_cost = round(lr_pred, 2)

        predicted_cost = max(predicted_cost, 0.0)
        ci_lower = round(max(predicted_cost - 1.96 * std_error, 0.0), 2)
        ci_upper = round(predicted_cost + 1.96 * std_error, 2)

        predictions.append(
            {
                "date": future_date.isoformat(),
                "predicted_cost": predicted_cost,
                "confidence_interval": {
                    "lower": ci_lower,
                    "upper": ci_upper,
                },
                "cloud": cloud,
            }
        )

    return predictions


def forecast_all_clouds(records_by_cloud: dict, forecast_days: int = 30) -> dict:
    result = {}
    for cloud, records in records_by_cloud.items():
        result[cloud] = forecast_costs(records, forecast_days=forecast_days, cloud=cloud)
    return result


def generate_insights(predictions: List[dict], historical_avg: float) -> List[str]:
    if not predictions:
        return ["Insufficient data for generating insights."]

    insights = []
    first_week = predictions[:7]
    first_week_avg = np.mean([p["predicted_cost"] for p in first_week])

    if historical_avg > 0:
        change_pct = ((first_week_avg - historical_avg) / historical_avg) * 100
        if change_pct > 10:
            insights.append(
                f"Cost will spike {abs(change_pct):.0f}% next week due to compute demand"
            )
        elif change_pct < -10:
            insights.append(
                f"Costs expected to decrease {abs(change_pct):.0f}% next week based on trends"
            )
        else:
            insights.append(
                f"Costs expected to remain stable next week ({change_pct:+.1f}% change)"
            )

    peak_day = max(predictions, key=lambda p: p["predicted_cost"])
    insights.append(
        f"Highest predicted spend on {peak_day['date']}: ${peak_day['predicted_cost']:,.2f}"
    )

    total_predicted = sum(p["predicted_cost"] for p in predictions)
    insights.append(
        f"Total 30-day forecast: ${total_predicted:,.2f} (avg ${total_predicted / len(predictions):,.2f}/day)"
    )

    return insights
