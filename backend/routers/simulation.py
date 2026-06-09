from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

RESOURCE_PRICING = {
    "EC2": {
        "cloud": "AWS",
        "vcpu_rate": 0.0416,
        "ram_rate": 0.0052,
        "base_cost": 15.0,
    },
    "Azure VM": {
        "cloud": "Azure",
        "vcpu_rate": 0.0385,
        "ram_rate": 0.0048,
        "base_cost": 14.0,
    },
    "GCP Compute": {
        "cloud": "GCP",
        "vcpu_rate": 0.0357,
        "ram_rate": 0.0045,
        "base_cost": 13.0,
    },
}


class ResourceConfig(BaseModel):
    vcpus: int = Field(..., ge=1, le=128)
    ram_gb: int = Field(..., ge=1, le=512)
    hours_per_day: float = Field(..., ge=1, le=24)


class SimulationRequest(BaseModel):
    resource_type: str = Field(..., pattern="^(EC2|Azure VM|GCP Compute)$")
    current_config: ResourceConfig
    proposed_config: ResourceConfig


def _monthly_cost(config: ResourceConfig, pricing: dict) -> float:
    daily = (
        pricing["base_cost"]
        + config.vcpus * pricing["vcpu_rate"] * config.hours_per_day
        + config.ram_gb * pricing["ram_rate"] * config.hours_per_day
    )
    return round(daily * 30, 2)


@router.post("/run")
def run_simulation(request: SimulationRequest):
    pricing = RESOURCE_PRICING.get(request.resource_type)
    if not pricing:
        return {"error": "Invalid resource type"}

    current_monthly = _monthly_cost(request.current_config, pricing)
    proposed_monthly = _monthly_cost(request.proposed_config, pricing)
    savings = round(current_monthly - proposed_monthly, 2)
    savings_pct = round((savings / current_monthly * 100) if current_monthly > 0 else 0, 2)

    if savings_pct > 20:
        recommendation = (
            f"Strong recommendation to apply changes. "
            f"Estimated {savings_pct}% monthly savings (${savings:,.2f}/month) "
            f"with minimal performance impact for the proposed workload."
        )
    elif savings_pct > 5:
        recommendation = (
            f"Moderate savings opportunity ({savings_pct}%). "
            f"Review workload requirements before applying changes."
        )
    elif savings_pct > 0:
        recommendation = (
            f"Minor savings of ${savings:,.2f}/month ({savings_pct}%). "
            f"Consider if migration effort is worth the savings."
        )
    elif savings_pct == 0:
        recommendation = "No cost difference between current and proposed configurations."
    else:
        recommendation = (
            f"Proposed configuration would increase costs by "
            f"${abs(savings):,.2f}/month ({abs(savings_pct)}%). Not recommended."
        )

    return {
        "resource_type": request.resource_type,
        "cloud": pricing["cloud"],
        "current_monthly_cost": current_monthly,
        "proposed_monthly_cost": proposed_monthly,
        "savings_amount": savings,
        "savings_percent": savings_pct,
        "recommendation": recommendation,
        "current_config": request.current_config.model_dump(),
        "proposed_config": request.proposed_config.model_dump(),
    }


@router.get("/resource-types")
def get_resource_types():
    return {
        "resource_types": [
            {"id": k, "cloud": v["cloud"], "label": k} for k, v in RESOURCE_PRICING.items()
        ]
    }
