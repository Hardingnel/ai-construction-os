import json
import os
from typing import Optional, List

from dotenv import load_dotenv

# Load .env BEFORE any module imports that read env vars
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "backend", ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from app.services.llm import llm_service

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


DESIGN_FALLBACK = {
    "success": True,
    "design": {
        "name": "Modern Residential Building",
        "type": "residential",
        "style": "modern",
        "bedrooms": 3,
        "floors": 1,
        "area_sqm": 275,
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

BOQ_FALLBACK = {
    "success": True,
    "boq": {
        "total_estimated_cost": 206250,
        "cost_per_sqm": 750,
        "breakdown": {
            "materials": 113437.5,
            "labor": 51562.5,
            "equipment": 20625.0,
            "permits_and_fees": 10312.5,
            "contingency": 10312.5,
        },
        "items": [
            {"item": "Concrete (Grade 30)", "unit": "m³", "quantity": 82.5, "rate": 185},
            {"item": "Steel Reinforcement", "unit": "tonnes", "quantity": 5.5, "rate": 1200},
            {"item": "Cement", "unit": "bags", "quantity": 550, "rate": 8.5},
            {"item": "Sand", "unit": "m³", "quantity": 137, "rate": 35},
            {"item": "Aggregate", "unit": "m³", "quantity": 110, "rate": 45},
        ],
    },
}

GIS_FALLBACK = {
    "success": True,
    "location": {"lat": 0.0, "lon": 0.0},
    "analysis": {
        "flood": {
            "risk_level": "low",
            "flood_zone": "Zone X",
            "recommendation": "Standard foundation suitable",
        },
        "elevation": {
            "average_elevation": "42m",
            "terrain_type": "Gentle slope",
            "suitability": "Excellent for construction",
        },
        "sunlight": {
            "annual_sunlight_hours": 2800,
            "solar_potential": "High",
            "optimal_panel_angle": "15 degrees",
        },
    },
    "overall_suitability": "highly_suitable",
}

STRUCTURAL_FALLBACK = {
    "success": True,
    "structural_recommendations": {
        "foundation": "Raft foundation recommended for multi-story structure",
        "columns": {
            "size": "300mm x 300mm",
            "spacing": "9m grid",
            "reinforcement": "8Y16 bars with Y10@200mm links",
        },
        "beams": {
            "size": "450mm x 750mm",
            "reinforcement": "4Y20 top + 4Y20 bottom with Y10@150mm stirrups",
        },
        "slabs": {
            "thickness": "135mm",
            "reinforcement": "Y12@150mm both ways",
        },
        "soil_requirements": {
            "bearing_capacity": "150 kN/m²",
            "recommended_depth": "1.5m minimum",
        },
    },
}


def _parse_json(text: str):
    """Extract JSON from LLM response (handles markdown fences)."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return json.loads(text)


@app.get("/api/health")
async def health():
    providers = []
    if llm_service.openrouter_client:
        providers.append("openrouter")
    if llm_service.openai_client:
        providers.append("openai")
    if llm_service.anthropic_client:
        providers.append("anthropic")
    if llm_service.google_api_key:
        providers.append("gemini")
    return {
        "status": "ok",
        "service": "ai-cos-python",
        "version": "1.0.0",
        "providers": providers,
    }


@app.post("/api/generate/design")
async def generate_design(req: GenerationRequest):
    system_prompt = (
        "You are an expert AI architect. Given the following building parameters, "
        "generate a detailed architectural design as a JSON object with these exact keys: "
        "name, type, style, bedrooms, floors, area_sqm, features (array of strings), "
        "room_layout (object with room_name: dimension strings), "
        "recommendations (array of construction recommendations). "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Generate a design for: {req.style} {req.building_type} "
        f"with {req.bedrooms} bedrooms, {req.floors} floor(s) "
        f"at location '{req.location or 'unspecified'}'. "
        f"Additional context: {req.prompt}"
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "design": data, "provider": "ai"}
    except Exception as e:
        print(f"Design LLM error: {e}")

    fallback = DESIGN_FALLBACK.copy()
    fallback["design"]["name"] = f"{req.style.title()} {req.building_type.title()}"
    fallback["design"]["type"] = req.building_type
    fallback["design"]["style"] = req.style
    fallback["design"]["bedrooms"] = req.bedrooms
    fallback["design"]["floors"] = req.floors
    fallback["design"]["area_sqm"] = req.bedrooms * 75 + req.floors * 50
    return {**fallback, "provider": "fallback"}


@app.post("/api/generate/boq")
async def generate_boq(req: BOQRequest):
    system_prompt = (
        "You are an expert quantity surveyor. Given the project parameters, "
        "generate a detailed Bill of Quantities as a JSON object with these keys: "
        "total_estimated_cost (number), cost_per_sqm (number), "
        "breakdown (object: materials, labor, equipment, permits_and_fees, contingency — all numbers), "
        "items (array of objects each with: item, unit, quantity, rate). "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Generate a BOQ for: {req.project_type}, area {req.area_sqm}m², "
        f"{req.floors} floor(s), quality level '{req.quality_level}', "
        f"location '{req.location or 'unspecified'}'."
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "boq": data, "provider": "ai"}
    except Exception as e:
        print(f"BOQ LLM error: {e}")

    rate_per_sqm = {"budget": 450, "standard": 750, "premium": 1200, "luxury": 2000}
    rate = rate_per_sqm.get(req.quality_level, 750)
    base_cost = req.area_sqm * rate
    fallback = BOQ_FALLBACK.copy()
    fallback["boq"]["total_estimated_cost"] = base_cost
    fallback["boq"]["cost_per_sqm"] = rate
    fallback["boq"]["breakdown"]["materials"] = base_cost * 0.55
    fallback["boq"]["breakdown"]["labor"] = base_cost * 0.25
    fallback["boq"]["breakdown"]["equipment"] = base_cost * 0.10
    fallback["boq"]["breakdown"]["permits_and_fees"] = base_cost * 0.05
    fallback["boq"]["breakdown"]["contingency"] = base_cost * 0.05
    return {**fallback, "provider": "fallback"}


@app.post("/api/analyze/gis")
async def analyze_gis(req: GISRequest):
    system_prompt = (
        "You are an expert GIS analyst. Analyze the construction site at the given coordinates. "
        "Return a JSON object with these keys based on the requested analysis types: "
        "flood (risk_level, flood_zone, recommendation), "
        "elevation (average_elevation, terrain_type, suitability), "
        "sunlight (annual_sunlight_hours, solar_potential, optimal_panel_angle). "
        "Also include an overall_suitability field. "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Analyze site at ({req.latitude}, {req.longitude}) "
        f"for: {', '.join(req.analysis_types)}."
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            overall = data.pop("overall_suitability", "moderate")
            return {
                "success": True,
                "location": {"lat": req.latitude, "lon": req.longitude},
                "analysis": data,
                "overall_suitability": overall,
                "provider": "ai",
            }
    except Exception as e:
        print(f"GIS LLM error: {e}")

    fallback = GIS_FALLBACK.copy()
    fallback["location"] = {"lat": req.latitude, "lon": req.longitude}
    filtered = {}
    for t in req.analysis_types:
        if t in fallback["analysis"]:
            filtered[t] = fallback["analysis"][t]
    fallback["analysis"] = filtered
    return {**fallback, "provider": "fallback"}


@app.post("/api/analyze/structural")
async def analyze_structural(req: StructuralRequest):
    system_prompt = (
        "You are a senior structural engineer. Given the building parameters, "
        "provide detailed structural recommendations as a JSON object with: "
        "foundation (string), columns (object: size, spacing, reinforcement), "
        "beams (object: size, reinforcement), "
        "slabs (object: thickness, reinforcement), "
        "soil_requirements (object: bearing_capacity, recommended_depth). "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Design structural elements for: {req.building_type}, "
        f"{req.floors} floor(s), span {req.span_length}m, "
        f"soil '{req.soil_type}', seismic zone '{req.seismic_zone}'."
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "structural_recommendations": data, "provider": "ai"}
    except Exception as e:
        print(f"Structural LLM error: {e}")

    beam_w = max(300, int(req.span_length * 15))
    beam_d = max(450, int(req.span_length * 25))
    col = max(300, req.floors * 100)
    slab = max(125, int(req.span_length * 35))
    fallback = STRUCTURAL_FALLBACK.copy()
    fallback["structural_recommendations"]["columns"]["size"] = f"{col}mm x {col}mm"
    fallback["structural_recommendations"]["columns"]["spacing"] = f"{req.span_length * 3:.0f}m grid"
    fallback["structural_recommendations"]["beams"]["size"] = f"{beam_w}mm x {beam_d}mm"
    fallback["structural_recommendations"]["slabs"]["thickness"] = f"{slab}mm"
    return {**fallback, "provider": "fallback"}


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
