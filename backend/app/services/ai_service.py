import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.models.request import MaintenanceRequest, WorkLog

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")

    def recommend_category_and_priority(self, title: str, description: str) -> Dict[str, Any]:
        """Categorize issue and recommend priority."""
        text = f"{title} {description}".lower()

        # If Gemini client is active, request structured inference
        if self.client:
            try:
                prompt = (
                    f"Analyze this maintenance request:\n"
                    f"Title: {title}\n"
                    f"Description: {description}\n\n"
                    f"Choose one category from: HVAC, Electrical, Plumbing, Mechanical, IT, Safety, Structural, Janitorial, Other.\n"
                    f"Choose one priority from: Low, Medium, High, Urgent.\n"
                    f"Return ONLY valid JSON with keys: category, priority, confidence (float between 0 and 1), reasoning (short sentence)."
                )
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                )
                text_content = response.text.strip()
                if "```json" in text_content:
                    text_content = text_content.split("```json")[1].split("```")[0].strip()
                elif "```" in text_content:
                    text_content = text_content.split("```")[1].split("```")[0].strip()
                data = json.loads(text_content)
                return {
                    "category": data.get("category", "General"),
                    "priority": data.get("priority", "Medium"),
                    "confidence": float(data.get("confidence", 0.9)),
                    "reasoning": data.get("reasoning", "Analyzed with Gemini AI based on keywords and context."),
                    "is_ai_generated": True,
                    "provider": "gemini"
                }
            except Exception as e:
                logger.warning(f"Gemini call failed: {e}. Falling back to rule-based engine.")

        # Grounded rule-based fallback
        category = "Other"
        priority = "Medium"
        reasoning = "Categorized based on operational domain keywords."
        confidence = 0.85

        if any(w in text for w in ["ac", "air condition", "heating", "chiller", "hvac", "ventilation", "temperature", "cold", "thermostat"]):
            category = "HVAC"
            reasoning = "Detected temperature or climate control keywords."
        elif any(w in text for w in ["leak", "water", "pipe", "drain", "sink", "toilet", "flood", "plumbing"]):
            category = "Plumbing"
            reasoning = "Detected plumbing, water flow, or pipe leakage keywords."
        elif any(w in text for w in ["power", "breaker", "spark", "wire", "outlet", "light", "electrical", "voltage"]):
            category = "Electrical"
            reasoning = "Detected electrical circuitry or lighting keywords."
        elif any(w in text for w in ["forklift", "motor", "belt", "conveyor", "gear", "engine", "machine", "mechanical"]):
            category = "Mechanical"
            reasoning = "Detected mechanical components or machinery terms."
        elif any(w in text for w in ["fire", "hazard", "smoke", "gas", "safety", "emergency", "slip"]):
            category = "Safety"
            priority = "Urgent"
            reasoning = "Safety or hazard risk detected requiring immediate attention."
        elif any(w in text for w in ["network", "wifi", "ethernet", "router", "server", "camera", "sensor"]):
            category = "IT"
            reasoning = "Detected IT networking or security hardware keywords."

        if any(w in text for w in ["urgent", "smoke", "flood", "danger", "burst", "outage", "stopped", "critical"]):
            priority = "Urgent"
        elif any(w in text for w in ["broken", "not working", "heavy", "leaking", "high", "asap"]):
            priority = "High"

        return {
            "category": category,
            "priority": priority,
            "confidence": confidence,
            "reasoning": reasoning,
            "is_ai_generated": False,
            "provider": "rule_based"
        }

    def generate_troubleshooting(
        self,
        db: Session,
        request: MaintenanceRequest
    ) -> Dict[str, Any]:
        """Provides diagnostic guidance and retrieves similar past resolved issues."""
        # 1. Retrieve similar past issues from real database
        similar_query = (
            db.query(MaintenanceRequest)
            .filter(
                MaintenanceRequest.organization_id == request.organization_id,
                MaintenanceRequest.id != request.id,
                MaintenanceRequest.status == "Closed",
                or_(
                    MaintenanceRequest.category == request.category,
                    MaintenanceRequest.asset_id == request.asset_id if request.asset_id else False
                )
            )
            .order_by(MaintenanceRequest.closed_at.desc())
            .limit(3)
            .all()
        )

        similar_past_issues = []
        for past in similar_query:
            # find latest work log
            log = db.query(WorkLog).filter(WorkLog.request_id == past.id).first()
            similar_past_issues.append({
                "request_number": past.request_number,
                "title": past.title,
                "resolution": past.completion_summary or (log.actions_taken if log else "Issue marked resolved"),
                "closed_at": past.closed_at.strftime("%Y-%m-%d") if past.closed_at else ""
            })

        # If Gemini is configured, prompt for tailored troubleshooting
        if self.client:
            try:
                past_context = "\n".join([f"- {p['title']}: {p['resolution']}" for p in similar_past_issues])
                prompt = (
                    f"A maintenance technician needs diagnostic guidance for this issue:\n"
                    f"Category: {request.category}\n"
                    f"Title: {request.title}\n"
                    f"Description: {request.description}\n"
                    f"Location details: {request.location_details or 'N/A'}\n"
                    f"Past similar resolutions in organization:\n{past_context or 'None recorded'}\n\n"
                    f"Return ONLY valid JSON with keys:\n"
                    f"- summary (brief diagnostic overview)\n"
                    f"- likely_causes (list of 2-3 most probable causes)\n"
                    f"- suggested_steps (list of 3-5 sequential inspection steps)\n"
                    f"- safety_precautions (list of 2 key safety rules)"
                )
                response = self.client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt
                )
                text_content = response.text.strip()
                if "```json" in text_content:
                    text_content = text_content.split("```json")[1].split("```")[0].strip()
                elif "```" in text_content:
                    text_content = text_content.split("```")[1].split("```")[0].strip()
                data = json.loads(text_content)
                return {
                    "summary": data.get("summary", "Troubleshooting guide prepared for technician review."),
                    "likely_causes": data.get("likely_causes", ["Component fatigue or wear", "Power or pressure fluctuation"]),
                    "suggested_steps": data.get("suggested_steps", ["Inspect visual indicators", "Verify power supply"]),
                    "safety_precautions": data.get("safety_precautions", ["Follow standard LOTO (Lockout/Tagout) protocols."]),
                    "similar_past_issues": similar_past_issues,
                    "is_available": True,
                    "provider_status": "ready"
                }
            except Exception as e:
                logger.warning(f"Gemini troubleshooting error: {e}")

        # Grounded fallback based on category
        cat = (request.category or "").lower()
        if "hvac" in cat:
            causes = ["Clogged air intake or filters", "Refrigerant pressure imbalance", "Faulty thermostat relay"]
            steps = ["Check breaker panel and control power", "Inspect filter status and coil airflow", "Measure inlet vs outlet delta temperature"]
            safety = ["Power down compressor before opening electrical enclosure", "Wear protective gloves around condenser fins"]
        elif "plumb" in cat:
            causes = ["Seal degradation or gasket wear", "High municipal water pressure", "Pipe obstruction or backflow"]
            steps = ["Isolate local shut-off valve", "Inspect fittings and joints for active weepage", "Check drain traps for debris"]
            safety = ["Beware of hot water lines and slippery floor hazards", "Use eye protection when clearing pressurized lines"]
        elif "electr" in cat:
            causes = ["Tripped breaker or blown fuse", "Loose terminal connections", "Overloaded circuit or short to ground"]
            steps = ["Verify absence of voltage with calibrated multimeter", "Inspect conductor insulation for thermal discoloration", "Test continuity and load draw"]
            safety = ["MANDATORY: Lockout/Tagout (LOTO) before touching conductors", "Use insulated 1000V rated tools"]
        else:
            causes = ["Mechanical misalignment or friction", "Wear on consumable elements", "Sensor calibration drift"]
            steps = ["Perform thorough visual and acoustic inspection", "Test manual operation under safe conditions", "Check lubrication and mounting bolts"]
            safety = ["Ensure emergency stops are tested and accessible", "Clear all non-essential personnel from operating radius"]

        return {
            "summary": f"Standard operational diagnostic procedures for {request.category} maintenance.",
            "likely_causes": causes,
            "suggested_steps": steps,
            "safety_precautions": safety,
            "similar_past_issues": similar_past_issues,
            "is_available": True,
            "provider_status": "deterministic"
        }

    def summarize_completion(self, db: Session, request: MaintenanceRequest) -> Dict[str, Any]:
        """Summarizes technician work logs, actions taken, and materials used."""
        logs = db.query(WorkLog).filter(WorkLog.request_id == request.id).all()
        total_hours = sum(l.hours_spent for l in logs)
        actions = [l.actions_taken for l in logs if l.actions_taken]

        findings = []
        if request.completion_summary:
            findings.append(request.completion_summary)
        for a in actions:
            findings.append(a)

        materials_summary = None
        if request.materials:
            materials_summary = ", ".join([f"{m.quantity} {m.unit} {m.item_name}" for m in request.materials])

        return {
            "summary": f"Work completed for request {request.request_number}: {request.title}. Total technician hours logged: {total_hours:.1f}h.",
            "key_findings": findings[:4] if findings else ["Standard inspection and repairs completed."],
            "materials_used_summary": materials_summary or "No spare parts consumed.",
            "time_spent_total": total_hours,
            "recommendation_for_preventive": f"Add quarterly preventative inspection for {request.category} equipment."
        }

ai_service = AIService()
