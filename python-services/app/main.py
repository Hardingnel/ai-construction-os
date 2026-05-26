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


class SustainabilityRequest(BaseModel):
    area: float = 300
    floors: int = 2
    building_type: str = "Residential"
    style: str = "Modern"
    bedrooms: int = 3
    location: Optional[str] = None
    flood_risk: Optional[str] = None


SUSTAINABILITY_FALLBACK = {
    "carbonFootprint": 0,
    "carbonRating": "C",
    "energyScore": 55,
    "energyRating": "C",
    "solarPotential": "Good",
    "solarKwhYear": 8000,
    "waterEfficiency": 50,
    "waterRating": "C",
    "passiveCooling": "Good",
    "floodResilience": "Moderate",
    "greenMaterialScore": 45,
    "overallScore": 55,
    "overallRating": "C",
    "recommendations": [
        "Improve building envelope insulation",
        "Install energy-efficient HVAC system",
        "Add solar panels to offset grid electricity",
    ],
    "breakdown": {"note": "AI unavailable, using estimated values"},
}


class ComplianceRequest(BaseModel):
    country: str
    project_type: Optional[str] = "Residential"
    floors: int = 2
    area: float = 300
    style: Optional[str] = "Modern"
    bedrooms: int = 3
    location: Optional[str] = None


@app.post("/api/analyze/sustainability")
async def analyze_sustainability(req: SustainabilityRequest):
    system_prompt = (
        "You are an expert sustainability analyst for building construction. "
        "Given the building parameters, assess sustainability and return a JSON object with these exact keys: "
        "carbonFootprint (number, kgCO2), carbonRating (string A+-E), "
        "energyScore (number 0-100), energyRating (string A+-E), "
        "solarPotential (string), solarKwhYear (number), "
        "waterEfficiency (number 0-100), waterRating (string A-E), "
        "passiveCooling (string), floodResilience (string), "
        "greenMaterialScore (number 0-100), "
        "overallScore (number 0-100), overallRating (string A+-E), "
        "recommendations (array of strings), "
        "breakdown (object with sub-scores for embodiedCarbon, operationalCarbon, "
        "solarInsolation, passiveScore, insulationScore, hvacScore, "
        "lightingScore, waterFixturesScore, rainwaterScore, recyclingScore). "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Assess sustainability for: {req.style} {req.building_type}, "
        f"area {req.area}m\u00B2, {req.floors} floor(s), {req.bedrooms} bedrooms, "
        f"location '{req.location or 'unspecified'}', "
        f"flood risk '{req.flood_risk or 'unknown'}'."
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "assessment": data, "provider": "ai"}
    except Exception as e:
        print(f"Sustainability LLM error: {e}")

    carbon_per_m2 = 500 * {"Sierra Leone": 0.42, "Nigeria": 0.48, "Ghana": 0.38, "Kenya": 0.35, "default": 0.40}.get(req.location or "", 0.40)
    carbon = round(req.area * carbon_per_m2 * (1 + req.floors * 0.24))
    insolation = {"Sierra Leone": 5.2, "Nigeria": 5.5, "Ghana": 5.0, "Kenya": 5.8, "default": 4.5}.get(req.location or "", 4.5)
    solar = round(req.area * 0.7 * insolation * 365 * 0.18)
    energy = round(min(100, 45 + req.floors * 5 + (15 if "Sustainable" in (req.style or "") else 0) + (10 if "Modern" in (req.style or "") else 0)))
    water = round(min(100, 40 + (10 if req.location else 0) + (15 if "Sustainable" in (req.style or "") else 0)))
    green = 78 if "Sustainable" in (req.style or "") else 55 if "Modern" in (req.style or "") else 45
    flood = {"low": "High", "medium": "Moderate", "high": "Low"}.get(req.flood_risk or "", "Moderate")
    passive = "Excellent" if (req.floors or 1) <= 2 and (req.style or "") in ["Tropical Modern", "Sustainable/Green", "African Contemporary", "Modern"] else "Good" if (req.floors or 1) <= 3 else "Fair"
    overall = round(
        (85 if carbon < 300 else 65 if carbon < 550 else 40) * 0.25
        + energy * 0.25
        + (80 if solar > 6000 else 55 if solar > 3000 else 30) * 0.15
        + water * 0.1
        + (85 if passive == "Excellent" else 65 if passive == "Good" else 40) * 0.1
        + (85 if flood == "High" else 55 if flood == "Moderate" else 25) * 0.1
        + green * 0.05
    )

    def rating(s: float, thresholds: list) -> str:
        for t, r in thresholds:
            if s >= t:
                return r
        return thresholds[-1][1]

    return {
        "success": True,
        "assessment": {
            "carbonFootprint": carbon,
            "carbonRating": rating(carbon / max(req.area, 1), [(900, "D"), (700, "C"), (550, "B"), (400, "A"), (0, "A+")]),
            "energyScore": energy,
            "energyRating": rating(energy, [(90, "A+"), (80, "A"), (65, "B"), (50, "C"), (35, "D"), (0, "E")]),
            "solarPotential": "Excellent" if solar > 15000 else "Very Good" if solar > 10000 else "Good" if solar > 6000 else "Fair" if solar > 3000 else "Poor",
            "solarKwhYear": solar,
            "waterEfficiency": water,
            "waterRating": rating(water, [(80, "A"), (60, "B"), (40, "C"), (20, "D"), (0, "E")]),
            "passiveCooling": passive,
            "floodResilience": flood,
            "greenMaterialScore": green,
            "overallScore": overall,
            "overallRating": rating(overall, [(85, "A+"), (75, "A"), (60, "B"), (45, "C"), (30, "D"), (0, "E")]),
            "recommendations": [
                "Improve building envelope insulation",
                "Install energy-efficient HVAC system",
                "Add solar panels to offset grid electricity",
            ],
            "breakdown": {
                "carbonPerM2": round(carbon / max(req.area, 1)),
                "solarInsolation": insolation,
                "passiveScore": energy,
            },
        },
        "provider": "fallback",
    }


@app.post("/api/analyze/compliance")
async def analyze_compliance(req: ComplianceRequest):
    system_prompt = (
        "You are an expert building compliance officer familiar with international building codes. "
        "Given the country and building parameters, run a compliance check and return a JSON object with: "
        "country (string), countryName (string), "
        "total (number), passed (number), failed (number), warnings (number), score (number 0-100), "
        "results (array of objects each with: code, title, status (passed/failed/warning), "
        "category, severity (mandatory/advisory), description, requirement, finding, recommendation). "
        "Include at least 4-8 compliance rules relevant to the given country. "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Run compliance check for {req.country}: {req.style} {req.project_type}, "
        f"{req.floors} floor(s), {req.area}m\u00B2, {req.bedrooms} bedrooms, "
        f"location '{req.location or 'unspecified'}'."
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "compliance": data, "provider": "ai"}
    except Exception as e:
        print(f"Compliance LLM error: {e}")

    return {"success": True, "compliance": {"country": req.country, "countryName": req.country, "total": 0, "passed": 0, "failed": 0, "warnings": 0, "score": 0, "results": []}, "provider": "fallback"}


class BIMAssistantRequest(BaseModel):
    query: str
    plan_name: Optional[str] = None
    element_count: int = 0
    elements_context: Optional[str] = None


@app.post("/api/analyze/bim-assistant")
async def analyze_bim_assistant(req: BIMAssistantRequest):
    system_prompt = (
        "You are an expert BIM (Building Information Modeling) assistant. "
        "Given a user query and optional floor plan context, provide a helpful answer "
        "about BIM modeling, floor plan creation, IFC classification, clash detection, "
        "quantity takeoff, or construction documentation. "
        "Return a JSON object with: answer (string with markdown formatting) and "
        "suggestions (array of 3-4 follow-up question strings). "
        "Be concise, practical, and use the floor plan context when provided. "
        "Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Query: {req.query}\n"
        f"Context: Working on floor plan \"{req.plan_name or 'untitled'}\" "
        f"with {req.element_count} elements.\n"
        f"Elements: {req.elements_context or 'N/A'}"
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "response": data, "provider": "ai"}
    except Exception as e:
        print(f"BIM Assistant LLM error: {e}")

    q = req.query.lower()
    if any(w in q for w in ["wall", "partition"]) or ("draw" in q and "plan" in q):
        answer = (
            f"To create walls in your floor plan:\n\n"
            f"1. Click \"Add Wall\" from the element palette\n"
            f"2. Click on the canvas to place the wall\n"
            f"3. Drag the edges to adjust length and thickness\n"
            f"4. Use the properties panel to set type, material, height\n"
            f"5. Walls connect automatically when placed end-to-end"
        )
        suggestions = ["How do I add doors in walls?", "What wall thickness for exterior?", "Explain wall layers"]
    elif "door" in q:
        answer = (
            f"Adding doors to your floor plan:\n\n"
            f"1. Place a wall first, then select \"Add Door\"\n"
            f"2. The door will snap to the nearest wall\n"
            f"3. Configure type, width (0.9m standard), height (2.1m)\n"
            f"4. Doors show swing direction on the plan"
        )
        suggestions = ["What size door for bathroom?", "How to add double doors?", "Door clearance requirements"]
    elif "window" in q:
        answer = (
            f"Placing windows in your floor plan:\n\n"
            f"1. Add a wall, then select \"Add Window\"\n"
            f"2. Windows auto-snap to wall centerlines\n"
            f"3. Configure type, width, sill height (0.9m)\n"
            f"4. Window area should be >= 10% of room area for natural lighting"
        )
        suggestions = ["Window-to-wall ratio best practice", "What is egress window?", "Window placement rules"]
    elif any(w in q for w in ["room", "space", "area"]):
        answer = (
            f"Creating rooms and spaces:\n\n"
            f"1. Select \"Add Room\" and drag to create boundaries\n"
            f"2. Room elements auto-calculate area in m\u00B2\n"
            f"3. Configure function, occupancy, floor finish\n"
            f"4. Rooms feed into quantity takeoff and schedules"
        )
        suggestions = ["Calculate total floor area", "Room area standards", "How to create room schedule"]
    elif any(w in q for w in ["clash", "conflict", "overlap"]):
        answer = (
            f"Clash detection:\n\n"
            f"- Run \"Detect Clashes\" to find overlapping elements\n"
            f"- Categories: High, Medium, Low severity\n"
            f"- Common: door intersecting wall, pipes through beams\n"
            f"- Fix positions in element properties panel"
        )
        suggestions = ["Run clash detection now", "What is hard clash vs soft clash?", "How to resolve clashes"]
    elif any(w in q for w in ["classif", "ifc", "standard"]):
        answer = (
            f"BIM Classification and IFC Standards:\n\n"
            f"Walls -> IfcWall, Doors -> IfcDoor\n"
            f"Windows -> IfcWindow, Rooms -> IfcSpace\n"
            f"Columns -> IfcColumn, Beams -> IfcBeam\n"
            f"Run \"Auto-Classify\" to assign correct IFC types"
        )
        suggestions = ["Run auto-classification", "What is IFC 2x3 vs IFC4?", "Export to IFC format"]
    elif any(w in q for w in ["quantity", "takeoff", "boq", "count"]):
        answer = (
            f"Quantity Takeoff from BIM model:\n\n"
            f"Run \"Quantity Takeoff\" to generate:\n"
            f"- Element counts by type\n"
            f"- Total wall length (linear meters)\n"
            f"- Total floor area (m\u00B2)\n"
            f"- Material quantities and subtype breakdown"
        )
        suggestions = ["Run quantity takeoff", "Export quantities to BOQ", "How to calculate concrete volume"]
    elif any(w in q for w in ["hello", "hi", "help"]):
        answer = (
            "Welcome to the AI BIM Assistant! I can help with:\n\n"
            "- Drawing floor plans (walls, doors, windows, rooms)\n"
            "- IFC classification and auto-classification\n"
            "- Clash detection and resolution\n"
            "- Quantity takeoff and measurements\n"
            "- Export to IFC, gbXML, DAE, OBJ formats"
        )
        suggestions = ["How to create a floor plan?", "What is BIM classification?", "Run clash detection"]
    else:
        answer = (
            f"I understand you're asking about \"{req.query}\". "
            f"I can help with floor plan elements, BIM classification, "
            f"clash detection, quantity takeoff, and exports. "
            f"Could you be more specific?"
        )
        suggestions = ["How to add a wall?", "What is a clash?", "Explain IFC classification"]

    return {"success": True, "response": {"answer": answer, "suggestions": suggestions}, "provider": "fallback"}


class TutorRequest(BaseModel):
    mode: str = "mentor"
    query: str
    level: Optional[str] = "intermediate"
    context: Optional[str] = None
    session_history: Optional[str] = None


@app.post("/api/analyze/tutor")
async def analyze_tutor(req: TutorRequest):
    is_explain = req.mode == "explain"
    system_prompt = (
        "You are an expert construction engineering tutor. "
        + (
            f"Given a construction concept and difficulty level ({req.level}), "
            "provide a clear educational explanation. "
            "Return JSON with: found (bool), concept (string), "
            "explanation (string, detailed for the given level), "
            "category (string), relatedTerms (array of strings), "
            "nextSteps (array of 3 strings). "
            "If the concept is not recognized, set found to false and suggest related concepts."
            if is_explain
            else "Given a user question about construction, provide an expert answer. "
            "Return JSON with: answer (string with markdown), "
            "relatedTerms (array of relevant topic strings). "
            "Be helpful, practical, and reference real construction practices."
        )
        + " Output ONLY valid JSON, no markdown, no explanation."
    )
    user_prompt = (
        f"Concept: {req.query}, Level: {req.level}"
        if is_explain
        else f"Question: {req.query}\nContext: {req.context or 'general'}"
    )
    try:
        raw = llm_service.generate(system_prompt, user_prompt)
        if raw:
            data = _parse_json(raw)
            return {"success": True, "tutor": data, "provider": "ai"}
    except Exception as e:
        print(f"Tutor LLM error: {e}")

    fallback = ({
        "found": False,
        "concept": req.query,
        "explanation": f"I don't have information on '{req.query}' yet.",
        "category": "General",
        "relatedTerms": [],
        "nextSteps": ["Search the glossary", "Ask a different question", "Start a mentor session"],
    } if is_explain else {
        "answer": f"I'm not sure about that. Could you rephrase?\n\nI can help with construction concepts, definitions, project management, costs, safety, and sustainability.",
        "relatedTerms": [],
    })
    return {"success": True, "tutor": fallback, "provider": "fallback"}


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
