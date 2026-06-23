from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import json
import tempfile
import re
import uvicorn

# Load environment variables
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path, override=True)

hf_token = os.getenv("HF_TOKEN")
if hf_token:
    print(f"INFO: Loaded HF_TOKEN successfully (starts with {hf_token[:10]}...)")
else:
    print("WARNING: HF_TOKEN not found in environment!")

from main import Backend

# Initialize FastAPI App
app = FastAPI(title="AI Medical Report Analyzer API")

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML/AI Backend
backend = Backend()

# Load model if it exists
if os.path.exists("anemia_model.pkl"):
    backend.loadModel()
else:
    print(
        "Warning: anemia_model.pkl not found. Predictions may fail unless model is trained."
    )


@app.get("/api/health")
async def api_health():
    return {"status": "healthy"}


@app.post("/api/analyze")
async def api_analyze(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".pdf"):
            return JSONResponse(
                status_code=400, content={"error": "Only PDF files are supported."}
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(await file.read())
            temp_path = temp_pdf.name

        try:
            values = backend.extractPdfValues(temp_path)

            # Check if extraction returned any metrics at all
            if not values:
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": "Could not extract any medical parameters from the PDF. Please upload a clear blood report containing standard CBC metrics (WBC, RBC, Hemoglobin, etc.)."
                    },
                )

            # Ensure all 7 features required by the Random Forest model are present in the exact order.
            # Fill missing keys with standard normal baselines to prevent model crashes.
            REQUIRED_FEATURES = ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC"]
            defaults = {
                "WBC": 7.0,  # normal range: 4.5 - 11.0
                "RBC": 5.0,  # normal range: 4.2 - 6.1
                "HGB": 15.0,  # normal range: 12.0 - 18.0
                "HCT": 45.0,  # normal range: 37.0 - 52.0
                "MCV": 90.0,  # normal range: 80.0 - 100.0
                "MCH": 30.0,  # normal range: 27.0 - 33.0
                "MCHC": 34.0,  # normal range: 32.0 - 36.0
            }

            sanitized_values = {}
            for feature in REQUIRED_FEATURES:
                sanitized_values[feature] = values.get(feature, defaults[feature])

            prediction = backend.predict(sanitized_values)
            prediction_name = backend.getPredictionName(prediction)

            # Create full clinical values map (incorporating PLT if extracted)
            clinical_values = dict(values)
            for feature in REQUIRED_FEATURES:
                if feature not in clinical_values:
                    clinical_values[feature] = defaults[feature]

            # Programmatically calculate medical diagnostics in Python
            score_data = backend.calculate_physiological_score(clinical_values)
            abnormal_findings = backend.calculate_abnormal_findings(clinical_values)
            normal_findings = backend.calculate_normal_findings(clinical_values)
            severity = backend.calculate_severity(abnormal_findings)
            health_status = backend.calculate_health_status(score_data["score"])
            risk_level = backend.calculate_risk_level(severity)

            # Programmatically derive primary analysis
            primary_analysis = backend.calculate_primary_analysis(
                prediction_name, severity, abnormal_findings
            )

            # Pass programmatic results to prompt to explain and detail
            explanation_json_str = backend.generateExplaination(
                prediction_name,
                clinical_values,
                severity,
                score_data["score"],
                abnormal_findings,
                normal_findings,
            )

            clean_json = explanation_json_str.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]

            json_match = re.search(r"\{.*\}", clean_json, re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)

            llm_data = json.loads(clean_json)

            # Combine calculated metrics (Python) and lifestyle recommendations (LLM)
            final_response = {
                "overview": {
                    "condition": primary_analysis["title"],
                    "severity": severity,
                    "physiological_score": score_data["score"],
                    "health_status": health_status,
                    "risk_level": risk_level,
                },
                "primary_analysis": primary_analysis,
                "condition_summary": primary_analysis["summary"],
                "abnormal_findings": abnormal_findings,
                "normal_findings": normal_findings,
                "specialist": llm_data.get("specialist", {}),
                "diet_plan": llm_data.get("diet_plan", {}),
                "daily_routine": llm_data.get("daily_routine", []),
                "exercise_plan": llm_data.get("exercise_plan", {}),
                "hydration": llm_data.get("hydration", {}),
                "prevention_tips": llm_data.get("prevention_tips", []),
                "follow_up_tests": llm_data.get("follow_up_tests", []),
                "final_summary": llm_data.get("final_summary", []),
            }
            return final_response
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        print(f"API Error during analysis: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    # Disable reload in production (when PORT is set) to prevent file system polling overhead
    reload = os.environ.get("PORT") is None
    uvicorn.run("ui:app", host="0.0.0.0", port=port, reload=reload)
