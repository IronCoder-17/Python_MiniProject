"""
main.py — Iconic Estates India | Python FastAPI Analytics Microservice
Runs on port 8000 (separate from the Node API on 5000).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import roi, recommendations, market, journey
import os

app = FastAPI(
    title="Iconic Estates India — Analytics Service",
    description="Investment ROI, property recommendations, market intelligence and ownership analytics.",
    version="1.0.0",
)

# Allow requests from the React frontend and Node backend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roi.router,             prefix="/api/roi",             tags=["ROI Calculator"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(market.router,          prefix="/api/market",          tags=["Market Intelligence"])
app.include_router(journey.router,         prefix="/api/journey",         tags=["Ownership Journey"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "Iconic Estates India Analytics"}
