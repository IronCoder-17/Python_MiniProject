"""
routers/recommendations.py — Simple rule-based property recommendation engine.
In production, replace with an ML model trained on user interaction logs.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class UserProfile(BaseModel):
    budget_min: float
    budget_max: float
    preferred_cities: List[str] = []
    property_types: List[str] = []
    bedrooms: Optional[int] = None
    purpose: str = "self_use"   # self_use | investment | rental


class Recommendation(BaseModel):
    reason: str
    suggested_cities: List[str]
    suggested_types: List[str]
    budget_advice: str
    investment_tip: str


@router.post("/suggest", response_model=Recommendation)
def suggest(profile: UserProfile):
    budget_mid = (profile.budget_min + profile.budget_max) / 2

    if profile.purpose == "investment":
        tip = "Focus on Hyderabad and Bangalore for highest appreciation; target 2–3 BHK for maximum rental demand."
        cities = profile.preferred_cities or ["Hyderabad", "Bangalore", "Pune"]
        types  = ["Flat", "Apartment", "Studio Apartment"]
    elif profile.purpose == "rental":
        tip = "Proximity to IT corridors drives sustained rental yields above 4%. Prefer Whitefield (BLR) or Hinjewadi (Pune)."
        cities = profile.preferred_cities or ["Bangalore", "Pune", "Hyderabad"]
        types  = ["Apartment", "Co-working Space"]
    else:
        tip = "For self-use, prioritise neighbourhood livability, school proximity, and possession timeline."
        cities = profile.preferred_cities or ["Ahmedabad", "Pune", "Bangalore"]
        types  = profile.property_types or ["Villa", "Bungalow", "Flat"]

    if budget_mid >= 50_000_000:
        b_advice = "At ₹5 Cr+, Ultra Luxury Villa or Luxury Penthouse delivers both lifestyle and wealth preservation."
    elif budget_mid >= 20_000_000:
        b_advice = "₹2–5 Cr range is the sweet spot for premium 3/4 BHK flats and independent villas in tier-1 suburbs."
    else:
        b_advice = "Under ₹2 Cr: target upcoming corridors (Bopal, Sarjapur, Gachibowli) for above-average appreciation."

    return Recommendation(
        reason=f"Based on {profile.purpose.replace('_',' ')} goal with ₹{budget_mid/1e5:.0f}L budget.",
        suggested_cities=cities,
        suggested_types=types,
        budget_advice=b_advice,
        investment_tip=tip,
    )
