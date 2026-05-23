from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Construction OS - Python Microservices",
    description="AI-powered architecture, engineering, and construction intelligence services",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    prompt: str
    building_type: Optional[str] = "residential"
    style: Optional[str] = "modern"
    bedrooms: Optional[int] = 3
    floors: Optional[int] = 1
    location: Optional[str] = None

class BOQRequest(BaseModel):
    project_type: str
    area_sqm: float
    floors: int
    quality_level: str = "standard"
    location: Optional[str] = None

class GISRequest(BaseModel):
    latitude: float
    longitude: float
    analysis_types: List[str] = ["flood", "elevation", "sunlight"]

class StructuralRequest(BaseModel):
    building_type: str
    floors: int
    span_length: float
    soil_type: str = "medium"
    seismic_zone: str = "zone_2"

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ai-cos-python", "version": "1.0.0"}

@app.post("/api/generate/design")
async def generate_design(req: GenerationRequest):
    try:
        return {
            "success": True,
            "design": {
                "name": f"{req.style.title()} {req.building_type.title()}",
                "type": req.building_type,
                "style": req.style,
                "bedrooms": req.bedrooms,
                "floors": req.floors,
                "area_sqm": req.bedrooms * 75 + req.floors * 50,
                "features": [
                    "Open floor plan",
                    "Natural lighting optimization",
                    "Smart home ready",
                    "Energy efficient",
                ],
                "room_layout": {
                    "living_room": "6m x 8m",
                    "kitchen": "4m x 5m",
                    "master_bedroom": "5m x 6m",
                    "dining": "4m x 6m",
                },
                "recommendations": [
                    "Use reinforced concrete frame for flood resistance",
                    "Install solar panels on south-facing roof",
                    "Implement rainwater harvesting system",
                ],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/boq")
async def generate_boq(req: BOQRequest):
    try:
        rate_per_sqm = {
            "budget": 450,
            "standard": 750,
            "premium": 1200,
            "luxury": 2000,
        }
        rate = rate_per_sqm.get(req.quality_level, 750)
        base_cost = req.area_sqm * rate

        return {
            "success": True,
            "boq": {
                "total_estimated_cost": base_cost,
                "cost_per_sqm": rate,
                "breakdown": {
                    "materials": base_cost * 0.55,
                    "labor": base_cost * 0.25,
                    "equipment": base_cost * 0.10,
                    "permits_and_fees": base_cost * 0.05,
                    "contingency": base_cost * 0.05,
                },
                "items": [
                    {"item": "Concrete (Grade 30)", "unit": "m³", "quantity": round(req.area_sqm * 0.3, 1), "rate": 185},
                    {"item": "Steel Reinforcement", "unit": "tonnes", "quantity": round(req.area_sqm * 0.02, 1), "rate": 1200},
                    {"item": "Cement", "unit": "bags", "quantity": round(req.area_sqm * 2, 0), "rate": 8.5},
                    {"item": "Sand", "unit": "m³", "quantity": round(req.area_sqm * 0.5, 0), "rate": 35},
                    {"item": "Aggregate", "unit": "m³", "quantity": round(req.area_sqm * 0.4, 0), "rate": 45},
                ],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/gis")
async def analyze_gis(req: GISRequest):
    try:
        results = {}
        if "flood" in req.analysis_types:
            results["flood"] = {
                "risk_level": "low",
                "flood_zone": "Zone X",
                "recommendation": "Standard foundation suitable",
            }
        if "elevation" in req.analysis_types:
            results["elevation"] = {
                "average_elevation": "42m",
                "terrain_type": "Gentle slope",
                "suitability": "Excellent for construction",
            }
        if "sunlight" in req.analysis_types:
            results["sunlight"] = {
                "annual_sunlight_hours": 2800,
                "solar_potential": "High",
                "optimal_panel_angle": "15 degrees",
            }
        return {
            "success": True,
            "location": {"lat": req.latitude, "lon": req.longitude},
            "analysis": results,
            "overall_suitability": "highly_suitable",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/structural")
async def analyze_structural(req: StructuralRequest):
    try:
        beam_size = f"{max(300, req.span_length * 15):.0f}mm x {max(450, req.span_length * 25):.0f}mm"
        column_size = f"{max(300, req.floors * 100):.0f}mm x {max(300, req.floors * 100):.0f}mm"
        slab_thickness = f"{max(125, req.span_length * 35):.0f}mm"

        return {
            "success": True,
            "structural_recommendations": {
                "foundation": "Raft foundation recommended for multi-story structure",
                "columns": {
                    "size": column_size,
                    "spacing": f"{req.span_length * 3:.0f}m grid",
                    "reinforcement": "8Y16 bars with Y10@200mm links",
                },
                "beams": {
                    "size": beam_size,
                    "reinforcement": "4Y20 top + 4Y20 bottom with Y10@150mm stirrups",
                },
                "slabs": {
                    "thickness": slab_thickness,
                    "reinforcement": "Y12@150mm both ways",
                },
                "soil_requirements": {
                    "bearing_capacity": "150 kN/m²",
                    "recommended_depth": "1.5m minimum",
                },
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate/document")
async def generate_document(doc_type: str, project_data: dict):
    try:
        return {
            "success": True,
            "document": {
                "type": doc_type,
                "generated": True,
                "format": "PDF",
                "pages": 12,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PYTHON_API_PORT", 8000)), reload=True)
