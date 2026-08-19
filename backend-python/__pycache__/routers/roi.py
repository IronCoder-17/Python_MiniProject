"""
routers/roi.py — 10-Year Investment Returns Calculator
All monetary values in INR (₹).
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List
import math

router = APIRouter()


class ROIInput(BaseModel):
    property_price: float       = Field(..., gt=0,  description="Property price in INR")
    down_payment_pct: float     = Field(20.0, ge=0, le=100)
    annual_appreciation_pct: float = Field(8.0,  ge=0, le=50)
    annual_rental_yield_pct: float = Field(3.0,  ge=0, le=30)
    holding_years: int          = Field(10,  ge=1, le=30)
    loan_interest_rate_pct: float = Field(8.5, ge=0, le=25, description="Home loan rate %")


class YearlyBreakdown(BaseModel):
    year: int
    property_value: float
    cumulative_rental: float
    loan_outstanding: float
    equity: float
    total_wealth: float


class ROIResult(BaseModel):
    property_price: float
    down_payment: float
    loan_amount: float
    future_value: float
    total_rental_income: float
    total_returns: float
    roi_pct: float
    annualised_roi_pct: float
    wealth_multiple: float
    yearly_breakdown: List[YearlyBreakdown]
    summary_text: str


@router.post("/calculate", response_model=ROIResult)
def calculate_roi(inp: ROIInput):
    price   = inp.property_price
    dp_pct  = inp.down_payment_pct / 100
    dp      = price * dp_pct
    loan    = price - dp
    r_month = (inp.loan_interest_rate_pct / 100) / 12
    n_months = inp.holding_years * 12

    # Monthly EMI (zero if no loan)
    if loan > 0 and r_month > 0:
        emi = loan * r_month * (1 + r_month) ** n_months / ((1 + r_month) ** n_months - 1)
    else:
        emi = loan / n_months if n_months else 0

    appr    = inp.annual_appreciation_pct / 100
    yield_r = inp.annual_rental_yield_pct / 100

    breakdown = []
    cumulative_rental = 0.0
    for yr in range(1, inp.holding_years + 1):
        prop_val = price * (1 + appr) ** yr
        # Rental income grows at 5% pa (standard market assumption)
        rental_yr = sum(price * yield_r * (1.05 ** (yr - 1 + m / 12)) / 12 for m in range(12))
        cumulative_rental += rental_yr

        # Loan outstanding (simple amortisation approximation)
        months_paid = yr * 12
        if loan > 0 and r_month > 0:
            loan_out = loan * (1 + r_month) ** months_paid - emi * ((1 + r_month) ** months_paid - 1) / r_month
            loan_out = max(0.0, loan_out)
        else:
            loan_out = max(0.0, loan - emi * months_paid)

        equity = prop_val - loan_out
        total_wealth = equity + cumulative_rental

        breakdown.append(YearlyBreakdown(
            year=yr,
            property_value=round(prop_val, 2),
            cumulative_rental=round(cumulative_rental, 2),
            loan_outstanding=round(loan_out, 2),
            equity=round(equity, 2),
            total_wealth=round(total_wealth, 2),
        ))

    future_value    = price * (1 + appr) ** inp.holding_years
    total_rental    = breakdown[-1].cumulative_rental
    total_returns   = (future_value - price) + total_rental
    invested        = dp + emi * n_months        # total cash out
    roi_pct         = (total_returns / invested * 100) if invested else 0
    wealth_multiple = (future_value + total_rental) / price
    ann_roi         = ((1 + roi_pct / 100) ** (1 / inp.holding_years) - 1) * 100 if roi_pct > -100 else 0

    def crore(v):
        return f"₹{v/1e7:.2f} Cr" if v >= 1e7 else f"₹{v/1e5:.2f} L"

    summary = (
        f"A {crore(price)} property held for {inp.holding_years} years at {inp.annual_appreciation_pct}% pa "
        f"appreciation and {inp.annual_rental_yield_pct}% rental yield grows to {crore(future_value)}, "
        f"generating {crore(total_rental)} in rent — a {wealth_multiple:.1f}x wealth multiple "
        f"({ann_roi:.1f}% annualised ROI)."
    )

    return ROIResult(
        property_price=round(price, 2),
        down_payment=round(dp, 2),
        loan_amount=round(loan, 2),
        future_value=round(future_value, 2),
        total_rental_income=round(total_rental, 2),
        total_returns=round(total_returns, 2),
        roi_pct=round(roi_pct, 2),
        annualised_roi_pct=round(ann_roi, 2),
        wealth_multiple=round(wealth_multiple, 2),
        yearly_breakdown=breakdown,
        summary_text=summary,
    )
