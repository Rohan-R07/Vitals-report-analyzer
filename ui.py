from nicegui import ui, app
import os
import base64
import json
import tempfile
import re
from main import Backend

# Initialize Backend
backend = Backend()

# Load model if it exists
if os.path.exists("anemia_model.pkl"):
    backend.loadModel()
else:
    print("Warning: anemia_model.pkl not found. Predictions may fail unless model is trained.")

@ui.expose
async def runAnalysis(base64_pdf):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
            temp_pdf.write(base64.b64decode(base64_pdf))
            temp_path = temp_pdf.name

        try:
            values = backend.extractPdfValues(temp_path)
            prediction = backend.predict(values)
            prediction_name = backend.getPredictionName(prediction)
            explanation_json_str = backend.generateExplaination(prediction_name, values)
            
            clean_json = explanation_json_str.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            
            # Sometimes LLMs return extra text before/after JSON
            json_match = re.search(r'\{.*\}', clean_json, re.DOTALL)
            if json_match:
                clean_json = json_match.group(0)
            
            data = json.loads(clean_json)
            return {"data": data}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        print(f"Error during analysis: {e}")
        return {"error": str(e)}

app.add_static_files('/frontend', 'frontend')

@ui.page('/')
def index_page():
    ui.add_head_html('<link rel="stylesheet" href="/frontend/styles.css">')
    
    with open('frontend/index.html', 'r') as f:
        html_content = f.read()
    
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if body_match:
        content = body_match.group(1)
        # Remove the script tag for app.js if it's already in the html, 
        # because we want to ensure it runs after NiceGUI is ready.
        content = re.sub(r'<script src="app.js"></script>', '', content, flags=re.IGNORECASE)
        ui.html(content)
    
    ui.add_body_html('<script src="/frontend/app.js"></script>')

ui.run(
    title="AI Medical Report Analyzer",
    dark=True,
    port=8080,
    reload=False
)
