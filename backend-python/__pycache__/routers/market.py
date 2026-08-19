"""
routers/market.py — Market Intelligence Analytics
Returns time-series data for chart rendering on the frontend.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import random, math

router = APIRouter()

# Simulated base data (replace with live DB queries via httpx to Node API in production)
CITY_DATA = {
    "Ahmedabad": {"1yr": 9.2,  "3yr": 28.5, "5yr": 52.0, "10yr": 145.0, "yield": 3.8, "psf": 6200},
    "Mumbai":    {"1yr": 7.5,  "3yr": 24.0, "5yr": 46.5, "10yr": 128.0, "yield": 2.9, "psf": 45000},
    "Bangalore": {"1yr": 8.8,  "3yr": 27.2, "5yr": 49.0, "10yr": 132.0, "yield": 4.4, "psf": 8800},
    "Pune":      {"1yr": 8.1,  "3yr": 25.8, "5yr": 47.5, "10yr": 121.0, "yield": 3.6, "psf": 7600},
    "Hyderabad": {"1yr": 9.6,  "3yr": 30.1, "5yr": 55.0, "10yr": 150.0, "yield": 4.1, "psf": 7200},
    "Delhi NCR": {"1yr": 7.0,  "3yr": 21.5, "5yr": 41.0, "10yr": 110.0, "yield": 2.6, "psf": 14000},
    "Surat":     {"1yr": 8.5,  "3yr": 26.0, "5yr": 48.0, "10yr": 130.0, "yield": 3.5, "psf": 4200},
    "Gandhinagar":{"1yr":7.8,  "3yr": 24.5, "5yr": 45.0, "10yr": 122.0, "yield": 3.3, "psf": 5000},
}

CURRENT_YEAR = 2026


class CityMetric(BaseModel):
    city: str
    growth_1yr: float
    growth_3yr: float
    growth_5yr: float
    growth_10yr: float
    rental_yield: float
    avg_psf: int


class TimeSeriesPoint(BaseModel):
    year: int
    index_value: float


class CityTimeSeries(BaseModel):
    city: str
    series: List[TimeSeriesPoint]


def _build_series(city: str, years: int = 12) -> List[TimeSeriesPoint]:
    """Reverse-engineer a plausible annual price index series ending at 100."""
    d = CITY_DATA.get(city, CITY_DATA["Ahmedabad"])
    annual_rate = d["1yr"] / 100
    base = 100 / (1 + annual_rate) ** years
    # add slight noise for realism
    series = []
    val = base
    for i in range(years + 1):
        noise = 1 + (random.random() - 0.5) * 0.01
        series.append(TimeSeriesPoint(year=CURRENT_YEAR - years + i, index_value=round(val * noise, 2)))
        val *= (1 + annual_rate)
    return series


@router.get("/overview", response_model=List[CityMetric])
def market_overview(cities: Optional[str] = Query(None, description="Comma-separated city names")):
    target = [c.strip() for c in cities.split(",")] if cities else list(CITY_DATA.keys())
    result = []
    for city in target:
        d = CITY_DATA.get(city)
        if not d:
            continue
        result.append(CityMetric(
            city=city,
            growth_1yr=d["1yr"],
            growth_3yr=d["3yr"],
            growth_5yr=d["5yr"],
            growth_10yr=d["10yr"],
            rental_yield=d["yield"],
            avg_psf=d["psf"],
        ))
    return result


@router.get("/timeseries", response_model=List[CityTimeSeries])
def time_series(
    cities: str = Query("Ahmedabad,Mumbai,Bangalore,Pune", description="Comma-separated"),
    years:  int = Query(10, ge=1, le=20),
):
    target = [c.strip() for c in cities.split(",")]
    return [CityTimeSeries(city=c, series=_build_series(c, years)) for c in target if c in CITY_DATA]


@router.get("/compare")
def compare_cities(city_a: str, city_b: str):
    a = CITY_DATA.get(city_a)
    b = CITY_DATA.get(city_b)
    if not a or not b:
        return {"error": "One or both cities not found"}
    return {
        "city_a": {"name": city_a, **a},
        "city_b": {"name": city_b, **b},
        "winner_appreciation": city_a if a["10yr"] > b["10yr"] else city_b,
        "winner_yield": city_a if a["yield"] > b["yield"] else city_b,
    }
