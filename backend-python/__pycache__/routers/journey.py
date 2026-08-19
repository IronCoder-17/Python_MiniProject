"""
routers/journey.py — Ownership Journey Analytics
Returns estimated timelines and cost breakdowns for each stage of property purchase.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()


class JourneyInput(BaseModel):
    property_price: float
    city: str = "Ahmedabad"
    is_loan: bool = True
    loan_pct: float = 80.0      # % of price as loan


class JourneyStep(BaseModel):
    step: int
    title: str
    description: str
    estimated_days_min: int
    estimated_days_max: int
    estimated_cost: float
    cost_label: str


class JourneyResult(BaseModel):
    total_min_days: int
    total_max_days: int
    steps: List[JourneyStep]
    total_upfront_cost: float
    total_upfront_label: str


# Stamp duty rates by state (simplified)
STAMP_DUTY = {
    "Ahmedabad": 0.045, "Gandhinagar": 0.045, "Surat": 0.045, "Vadodara": 0.045, "Rajkot": 0.045,
    "Mumbai": 0.06, "Pune": 0.06,
    "Bangalore": 0.056,
    "Hyderabad": 0.05,
    "Delhi NCR": 0.055,
}


@router.post("/calculate", response_model=JourneyResult)
def calculate_journey(inp: JourneyInput):
    p = inp.property_price
    sd_rate = STAMP_DUTY.get(inp.city, 0.05)
    loan = p * inp.loan_pct / 100 if inp.is_loan else 0

    def fmt(v):
        if v >= 1e7:
            return f"₹{v/1e7:.2f} Cr"
        return f"₹{v/1e5:.2f} L"

    steps = [
        JourneyStep(step=1, title="Property Discovery",
                    description="Shortlist properties, site visits, negotiation.",
                    estimated_days_min=7, estimated_days_max=30,
                    estimated_cost=0, cost_label="₹0 (Brokerage at closing)"),
        JourneyStep(step=2, title="Site Visit & Negotiation",
                    description="2–3 site visits, price negotiation, builder checks.",
                    estimated_days_min=3, estimated_days_max=14,
                    estimated_cost=0, cost_label="₹0"),
        JourneyStep(step=3, title="Documentation & Agreement",
                    description="Title search, sale agreement, token amount (1–2% of price).",
                    estimated_days_min=7, estimated_days_max=21,
                    estimated_cost=p * 0.01, cost_label=fmt(p * 0.01) + " (token)"),
        JourneyStep(step=4, title="Loan Processing",
                    description="Bank valuation, loan sanction, disbursal (if applicable).",
                    estimated_days_min=15, estimated_days_max=45,
                    estimated_cost=loan * 0.005, cost_label=fmt(loan * 0.005) + " (processing fee)" if loan else "N/A"),
        JourneyStep(step=5, title="Registration",
                    description="Stamp duty, registration charges, sub-registrar office.",
                    estimated_days_min=1, estimated_days_max=5,
                    estimated_cost=p * sd_rate + p * 0.01, cost_label=fmt(p * (sd_rate + 0.01)) + " (stamp + reg)"),
        JourneyStep(step=6, title="Possession",
                    description="Snag check, key handover, utility connections.",
                    estimated_days_min=1, estimated_days_max=7,
                    estimated_cost=p * 0.005, cost_label=fmt(p * 0.005) + " (misc)"),
        JourneyStep(step=7, title="Wealth Creation",
                    description="Annual appreciation, rental income tracking.",
                    estimated_days_min=365, estimated_days_max=3650,
                    estimated_cost=0, cost_label="Ongoing"),
    ]

    upfront = sum(s.estimated_cost for s in steps)
    return JourneyResult(
        total_min_days=sum(s.estimated_days_min for s in steps[:-1]),
        total_max_days=sum(s.estimated_days_max for s in steps[:-1]),
        steps=steps,
        total_upfront_cost=round(upfront, 2),
        total_upfront_label=fmt(upfront),
    )
