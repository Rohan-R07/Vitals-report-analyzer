import pandas
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv
import joblib
from pypdf import PdfReader
import os
import regex as re
from ai_provider import AIProvider
import io
import logging
import json

# Setup logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("medical_report_analyzer")

# Alias mapping for CBC parameters (sorted from longest to shortest within lists)
ALIAS_MAP = {
    "WBC": [
        "white blood cell count", "white blood cells", "total wbc count",
        "total wbc", "wbc count", "wbc"
    ],
    "RBC": [
        "red blood cell count", "red blood cells", "total rbc count",
        "total rbc", "rbc count", "rbc"
    ],
    "HGB": [
        "haemoglobin", "hemoglobin", "hgb", "hb"
    ],
    "HCT": [
        "packed cell volume", "hematocrit", "haematocrit", "pcv", "hct"
    ],
    "MCV": [
        "mean corpuscular volume", "mcv"
    ],
    "MCH": [
        "mean corpuscular hemoglobin", "mean corpuscular haemoglobin", "mch"
    ],
    "MCHC": [
        "mean corpuscular hemoglobin concentration", 
        "mean corpuscular haemoglobin concentration", "mchc"
    ],
    "PLT": [
        "platelet count", "platelets", "plt"
    ]
}

def normalize_text(text):
    if not text:
        return ""
    # Replace tabs, newlines, carriage returns with spaces
    normalized = text.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
    # Collapse multiple spaces to a single space
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized.strip()

def normalize_aliases(text):
    for key, aliases in ALIAS_MAP.items():
        # Sort aliases by length descending
        sorted_aliases = sorted(aliases, key=len, reverse=True)
        for alias in sorted_aliases:
            # Lookbehind/lookahead for word boundary to prevent substring collision
            pattern = rf"(?<![a-zA-Z0-9]){re.escape(alias)}(?![a-zA-Z0-9])"
            text = re.sub(pattern, key, text, flags=re.IGNORECASE)
    return text

def normalize_unit(key, val, unit):
    if val is None:
        return None
    unit_str = str(unit).lower() if unit else ""
    
    if key == "WBC":
        if val > 100.0:
            val = val / 1000.0
        return round(val, 2)
        
    elif key == "RBC":
        if val > 1000.0:
            val = val / 1000000.0
        return round(val, 2)
        
    elif key == "HGB":
        if val > 50.0:
            val = val / 10.0
        return round(val, 2)
        
    elif key == "HCT":
        if val < 1.0:
            val = val * 100.0
        return round(val, 2)
        
    elif key == "MCV":
        return round(val, 2)
        
    elif key == "MCH":
        return round(val, 2)
        
    elif key == "MCHC":
        if val < 1.0:
            val = val * 100.0
        elif val > 100.0:
            val = val / 10.0
        return round(val, 2)
        
    elif key == "PLT":
        if "lakh" in unit_str or "10^5" in unit_str or "10*5" in unit_str:
            val = val * 100.0
        elif "million" in unit_str or "10^6" in unit_str or "10*6" in unit_str:
            val = val * 1000.0
        elif any(k in unit_str for k in ["10^3", "10*3", "10e3", "k", "thousand"]):
            pass
        elif val < 20.0:
            val = val * 100.0
        elif val > 1000.0:
            val = val / 1000.0
        return round(val, 2)
        
    return round(val, 2)

def extract_text_via_ocr(pdf_file):
    try:
        import easyocr
        import fitz  # PyMuPDF
        
        logger.info("Initializing EasyOCR reader for English...")
        reader = easyocr.Reader(['en'], verbose=False)
        
        doc = fitz.open(pdf_file)
        ocr_text = ""
        
        for page_num in range(len(doc)):
            logger.info(f"Running OCR on page {page_num + 1}/{len(doc)}...")
            page = doc[page_num]
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            
            results = reader.readtext(img_bytes)
            page_text = " ".join([res[1] for res in results])
            ocr_text += page_text + "\n"
            
        return ocr_text
    except Exception as e:
        logger.error(f"Error during OCR extraction: {e}")
        return ""


def extract_parameters_via_vision(pdf_file):
    try:
        import fitz
        import base64
        from openai import OpenAI

        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {}

        model = os.getenv("OPENROUTER_MODEL") or "google/gemma-4-26b-a4b-it"

        doc = fitz.open(pdf_file)
        if len(doc) == 0:
            return {}

        pix = doc[0].get_pixmap(dpi=150)
        img_bytes = pix.tobytes("png")
        b64_str = base64.b64encode(img_bytes).decode("utf-8")

        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )

        prompt = (
            "Extract all Complete Blood Count (CBC) parameter values from this laboratory report image. "
            "Focus on finding numeric values for: WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT. "
            "Return ONLY a valid JSON object mapping parameter names to numbers, e.g. "
            '{"WBC": 7.0, "RBC": 5.0, "HGB": 14.5, "HCT": 42.0, "MCV": 90.0, "MCH": 30.0, "MCHC": 33.0, "PLT": 250.0}.'
        )

        logger.info(f"Initiating Vision LLM extraction with model: {model}...")
        response = client.chat.completions.create(
            model=model,
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{b64_str}"
                            }
                        }
                    ]
                }
            ]
        )

        content = response.choices[0].message.content or ""
        clean_json = content.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]

        json_match = re.search(r"\{.*\}", clean_json, re.DOTALL)
        if json_match:
            clean_json = json_match.group(0)

        data = json.loads(clean_json)
        vision_data = {}
        if isinstance(data, dict):
            for k, v in data.items():
                k_upper = str(k).upper()
                if k_upper in ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT"]:
                    try:
                        val = float(v)
                        vision_data[k_upper] = normalize_unit(k_upper, val, "")
                    except Exception:
                        pass
        logger.info(f"Vision LLM extracted parameters: {list(vision_data.keys())}")
        return vision_data
    except Exception as e:
        logger.error(f"Vision LLM parameter extraction failed: {e}")
        return {}


def extract_parameters_from_text(text):
    patient_data = {}
    
    # Separator/noise pattern: spaces, colons, hyphens, equals, words like value/result, parenthesized blocks, spaces
    separator_noise = r"(?:\s*[\(\[\{][^\]\)\}]*[\)\]\}]|\s*[:\-=\/]\s*|\s*(?:result|value|count|level|levels|flag|high|low|normal)\s*|\s+)*"
    
    # Matches common CBC units case-insensitively, supporting scientific notation exponent [eE] (e.g. 10E3, 10E6)
    unit_regex = r"(?:x\s*10[\^eE]?\s*3\s*/\s*uL|10[\^eE]?\s*3\s*/\s*uL|x\s*10[\^eE]?\s*3|10[\^eE]?\s*3|k/cumm|k/uL|k\b|thousand[s]?/uL|thousand[s]?/cumm|thousand[s]?|/uL|/cumm|/cmm|uL|cumm|cmm|x\s*10[\^eE]?\s*6\s*/\s*uL|10[\^eE]?\s*6\s*/\s*uL|x\s*10[\^eE]?\s*6|10[\^eE]?\s*6|million/uL|m/uL|million|g/dL|g/L|gm/dL|gm%|%|vol%|fL|pg|lakh[s]?/cumm|lakh[s]?)"
    
    # Flag noise that can appear between the value and the unit
    flag_noise = r"(?:\s*(?:alert|critical|low|high|normal|abnormal|verified|by)*\s*)*"
    
    for key in ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT"]:
        try:
            pattern = rf"(?<![a-zA-Z0-9]){key}(?![a-zA-Z0-9])"
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            
            for match in matches:
                start_pos = match.end()
                sub = text[start_pos:start_pos+100]
                
                # Match number, optional unit. Handles optional zero-padded footnote codes (like 01-09) before the actual result
                value_pattern = rf"^{separator_noise}(?:(0[1-9])\s+{separator_noise})?(\d+(?:\.\d+)?|\d{{1,3}}(?:,\d{{3}})+)(?:{flag_noise}({unit_regex}))?"
                val_match = re.match(value_pattern, sub, re.IGNORECASE)
                if val_match:
                    val_str = val_match.group(2).replace(',', '')
                    val = float(val_str)
                    unit = val_match.group(3)
                    
                    normalized_val = normalize_unit(key, val, unit)
                    patient_data[key] = normalized_val
                    break
        except Exception as e:
            logger.error(f"Failed to extract parameter {key}: {e}")
            
    return patient_data

def log_extraction_summary(text_success, detected, missing, normalized, confidence, ocr_used, prediction_input):
    log_data = {
        "text_extraction_success": text_success,
        "ocr_used": ocr_used,
        "detected_parameters": list(detected),
        "missing_parameters": list(missing),
        "normalized_values": normalized,
        "confidence_score": f"{confidence * 100:.1f}%",
        "prediction_input": prediction_input
    }
    logger.info(f"\n================ CBC EXTRACTION LOG ================\n"
                f"{json.dumps(log_data, indent=2)}\n"
                f"====================================================")

current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(os.path.dirname(current_dir), ".env")
load_dotenv(dotenv_path, override=True)


class Backend:
    def __init__(self):
        self.csvData = None
        self.model = None
        self.accuracy = None
        self.ai_provider = AIProvider()

    # Loading Dataset and storing it in csvData variable
    def setDataset(self, file):
        self.csvData = pandas.read_excel(file)

    # Training models
    def trainModel(self):

        # X is a variable in which the first 7 attributes of the dataset is stored. THESE are INPUT VALUES USING THIS Y WILL BE PREDICTED
        X = self.csvData[["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC"]]

        # Prediction input / output values or labels
        y = self.csvData["All_Class"]

        # splitting dataset into training and testing data (using a single dataset for both the task)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Creating an random forest classifer and storing it in self.model (this model have 100 decision trees)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)

        # Training model by giving it data
        self.model.fit(X_train, y_train)

        # Model is testing on the given dataset
        predictions = self.model.predict(X_test)

        # comparing it with actual values to calculate the accuracy of the models
        self.accuracy = accuracy_score(y_test, predictions)

        # storing trained model so that we don't need to repeat this process again and again
        joblib.dump(self.model, "anemia_model.pkl")

    # Loading trained model
    def loadModel(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(current_dir, "anemia_model.pkl")
        self.model = joblib.load(model_path)

    # Making Prediction patient_dict means the the value input values extracted from pdf and passed here
    def predict(self, patient_dict):

        # using the parms and converting it into
        patient_df = pandas.DataFrame([patient_dict])

        # predicting Y using the given patient df
        prediction = self.model.predict(patient_df)

        # returns the predicted values (0: Normal, 1: Hemoglobin Anemia, 2: Iron Deficiency Anemia, 3: Folate Deficiency Anemia, 4: Vitamin B12 Deficiency Anemia)
        return prediction[0]

    # this function is used to make the predicted number with a string which imply the diseases which they are having
    def getPredictionName(self, prediction):

        class_mapping = {
            0: "Normal",
            1: "Hemoglobin Anemia",
            2: "Iron Deficiency Anemia",
            3: "Folate Deficiency Anemia",
            4: "Vitamin B12 Deficiency Anemia",
        }
        return class_mapping[prediction]

    # Independent function just using to extract input values from the given PDF file
    # The Input_ values is always a fixed sequence of numbers (WBC, RBC, HGB, HCT, MCV, MCH, MCHC)
    def extractPdfValues(self, pdf_file):
        all_text = ""
        ocr_used = False
        text_success = False

        # Try PyMuPDF (fitz) first as it is much more robust for layout tables
        try:
            import fitz
            doc = fitz.open(pdf_file)
            for page in doc:
                text_content = page.get_text("text")
                if text_content:
                    all_text += text_content + " "
            all_text = all_text.strip()
        except Exception as e:
            logger.error(f"PyMuPDF text extraction error: {e}")

        # Fallback to PyPDF if PyMuPDF extracted nothing
        if not all_text:
            try:
                pdf = PdfReader(pdf_file)
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        all_text += page_text + " "
                all_text = all_text.strip()
            except Exception as e:
                logger.error(f"PyPDF extraction error: {e}")

        # Check if PyPDF returned little or no text
        is_empty_or_tiny = len(all_text.strip()) < 100

        patient_data = {}
        confidence = 0.0
        
        if not is_empty_or_tiny:
            normalized_text = normalize_text(all_text)
            alias_normalized_text = normalize_aliases(normalized_text)
            patient_data = extract_parameters_from_text(alias_normalized_text)
            
            # Calculate confidence
            extracted_count = len(patient_data)
            if extracted_count == 8:
                confidence = 1.0
            elif extracted_count == 7:
                confidence = 0.90
            elif extracted_count == 6:
                confidence = 0.75
            else:
                confidence = (extracted_count / 8.0) * 0.8
                
            text_success = True

        # Fallback to Vision LLM or OCR if text is insufficient or confidence is below 70% (less than 6 parameters)
        if is_empty_or_tiny or len(patient_data) < 6:
            logger.info("Text extraction yielded < 6 parameters. Attempting Vision LLM parameter extraction...")
            vision_patient_data = extract_parameters_via_vision(pdf_file)
            
            if len(vision_patient_data) >= len(patient_data) and len(vision_patient_data) > 0:
                ocr_used = True
                patient_data = vision_patient_data
                text_success = True
                extracted_count = len(patient_data)
                confidence = 1.0 if extracted_count == 8 else (0.90 if extracted_count == 7 else (0.75 if extracted_count == 6 else (extracted_count / 8.0) * 0.8))
            else:
                logger.info("Falling back to local OCR...")
                ocr_text = extract_text_via_ocr(pdf_file)
                
                if len(ocr_text.strip()) >= 50:
                    ocr_used = True
                    normalized_ocr_text = normalize_text(ocr_text)
                    alias_normalized_ocr_text = normalize_aliases(normalized_ocr_text)
                    ocr_patient_data = extract_parameters_from_text(alias_normalized_ocr_text)
                    
                    if len(ocr_patient_data) >= len(patient_data):
                        patient_data = ocr_patient_data
                        text_success = True

        # Calculate final lists of detected/missing parameters
        all_features = ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT"]
        detected = set(patient_data.keys())
        missing = set(all_features) - detected

        # Prediction input format (first 7 parameters)
        REQUIRED_FEATURES = ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC"]
        defaults = {
            "WBC": 7.0,
            "RBC": 5.0,
            "HGB": 15.0,
            "HCT": 45.0,
            "MCV": 90.0,
            "MCH": 30.0,
            "MCHC": 34.0,
        }
        prediction_input = {feat: patient_data.get(feat, defaults[feat]) for feat in REQUIRED_FEATURES}

        # Log extraction details
        log_extraction_summary(
            text_success=text_success,
            detected=detected,
            missing=missing,
            normalized=patient_data,
            confidence=confidence,
            ocr_used=ocr_used,
            prediction_input=prediction_input
        )

        # Reject report if confidence is below 70% (i.e. fewer than 6 parameters)
        if confidence < 0.70 or len(patient_data) < 6:
            logger.warning(f"Report rejected. Confidence ({confidence * 100:.1f}%) is below 70% (less than 6 parameters).")
            return {}

        return patient_data

    """
    # some times the value which is extraceted from the pdf is not in the range so we need to check it and some of them are not real or the way 
    they write in reports are usually different is it is necessary to find the abnormal stuffs so that the accuracy of the model won't go down 
    """

    def calculate_abnormal_findings(self, values):
        """
        Calculates out-of-range metrics programmatically using reference_ranges.py.
        """
        from reference_ranges import REFERENCE_RANGES

        findings = []
        for key, ref in REFERENCE_RANGES.items():
            if key in values:
                val = values[key]
                if key == "PLT":
                    # Special check for Platelets borderline low range
                    if ref["borderline_min"] <= val <= ref["borderline_max"]:
                        findings.append(
                            {
                                "parameter": ref["name"],
                                "value": val,
                                "status": "Borderline",
                                "explanation": f"Platelet Count ({val}) is borderline low (normal: {ref['min']} - {ref['max']} {ref['unit']}).",
                                "is_mild": True,
                                "is_significant": False,
                                "is_critical": False,
                            }
                        )
                    elif val < ref["borderline_min"]:
                        is_crit = val <= ref["critical_low"]
                        findings.append(
                            {
                                "parameter": ref["name"],
                                "value": val,
                                "status": "Low",
                                "explanation": f"Platelet Count ({val}) is below normal range ({ref['min']} - {ref['max']} {ref['unit']}).",
                                "is_mild": False,
                                "is_significant": not is_crit,
                                "is_critical": is_crit,
                            }
                        )
                    elif val > ref["max"]:
                        is_crit = val >= ref["critical_high"]
                        findings.append(
                            {
                                "parameter": ref["name"],
                                "value": val,
                                "status": "High",
                                "explanation": f"Platelet Count ({val}) is above normal range ({ref['min']} - {ref['max']} {ref['unit']}).",
                                "is_mild": False,
                                "is_significant": not is_crit,
                                "is_critical": is_crit,
                            }
                        )
                else:
                    # General CBC parameters
                    if val < ref["min"]:
                        is_crit = val <= ref["critical_low"]
                        deviation_pct = (ref["min"] - val) / ref["min"]
                        is_sig = deviation_pct > 0.15 and not is_crit
                        findings.append(
                            {
                                "parameter": ref["name"],
                                "value": val,
                                "status": "Low",
                                "explanation": f"{ref['full_name']} ({val}) is below normal range ({ref['min']} - {ref['max']} {ref['unit']}).",
                                "is_mild": not is_sig and not is_crit,
                                "is_significant": is_sig,
                                "is_critical": is_crit,
                            }
                        )
                    elif val > ref["max"]:
                        is_crit = val >= ref["critical_high"]
                        deviation_pct = (val - ref["max"]) / ref["max"]
                        is_sig = deviation_pct > 0.15 and not is_crit
                        findings.append(
                            {
                                "parameter": ref["name"],
                                "value": val,
                                "status": "High",
                                "explanation": f"{ref['full_name']} ({val}) is above normal range ({ref['min']} - {ref['max']} {ref['unit']}).",
                                "is_mild": not is_sig and not is_crit,
                                "is_significant": is_sig,
                                "is_critical": is_crit,
                            }
                        )
        return findings

    def calculate_normal_findings(self, values):
        """
        Calculates in-range metrics programmatically using reference_ranges.py.
        """
        from reference_ranges import REFERENCE_RANGES

        findings = []
        for key, ref in REFERENCE_RANGES.items():
            if key in values:
                val = values[key]
                is_normal = False
                if key == "PLT":
                    if ref["min"] <= val <= ref["max"]:
                        is_normal = True
                else:
                    if ref["min"] <= val <= ref["max"]:
                        is_normal = True

                if is_normal:
                    findings.append(
                        {
                            "parameter": ref["name"],
                            "value": val,
                            "status": "Normal",
                            "explanation": f"{ref['full_name']} ({val}) is within normal range ({ref['min']} - {ref['max']} {ref['unit']}).",
                        }
                    )
        return findings

    def calculate_physiological_score(self, values):
        """
        Subtracts points from 100 for deviations and returns score and status category using reference_ranges.py.
        """
        from reference_ranges import REFERENCE_RANGES, get_health_status

        score = 100
        for key, ref in REFERENCE_RANGES.items():
            if key in values:
                val = values[key]
                if key == "PLT":
                    if ref["borderline_min"] <= val <= ref["borderline_max"]:
                        score -= ref["deduction_borderline"]
                    elif val < ref["borderline_min"] or val > ref["max"]:
                        if val <= ref["critical_low"] or val >= ref["critical_high"]:
                            score -= ref["deduction_critical"]
                        else:
                            score -= ref["deduction_abnormal"]
                else:
                    if val < ref["min"] or val > ref["max"]:
                        if val <= ref["critical_low"] or val >= ref["critical_high"]:
                            score -= 15
                        else:
                            score -= ref["deduction"]
        score = max(0, score)
        return {"score": score, "category": get_health_status(score)}

    def calculate_severity(self, arg):
        """
        Determines severity from abnormalities count and types (Mild, Moderate, Severe).
        """
        if isinstance(arg, dict):
            abnormal_findings = self.calculate_abnormal_findings(arg)
        else:
            abnormal_findings = arg

        critical_count = sum(1 for f in abnormal_findings if f.get("is_critical"))
        significant_count = sum(1 for f in abnormal_findings if f.get("is_significant"))

        if critical_count > 0:
            return "Severe"
        if significant_count >= 2:
            return "Moderate"

        total_abnormalities = len(abnormal_findings)
        if total_abnormalities >= 4:
            return "Moderate"
        elif total_abnormalities >= 1:
            return "Mild"
        else:
            return "Normal"

    def calculate_health_status(self, score):
        """
        Maps a physiological score to a health status rating using reference_ranges.py.
        """
        from reference_ranges import get_health_status

        return get_health_status(score)

    def calculate_risk_level(self, severity):
        """
        Maps clinical severity to general risk levels.
        """
        if severity == "Severe":
            return "High"
        elif severity == "Moderate":
            return "Moderate"
        else:
            return "Low"

    def calculate_primary_analysis(self, prediction_name, severity, abnormal_findings):
        """
        Derives primary analysis programmatically based on prediction, severity, and findings.
        """
        has_abnormalities = len(abnormal_findings) > 0
        is_normal_severity = severity == "Normal"

        if not has_abnormalities and is_normal_severity:
            return {
                "title": "Normal",
                "summary": "All blood parameters are within normal ranges.",
            }

        # Check for Hemoglobin Low in abnormal findings
        has_low_hgb = any(
            f.get("parameter") == "Hemoglobin" and f.get("status") == "Low"
            for f in abnormal_findings
        )

        if severity == "Mild" or is_normal_severity:
            if has_low_hgb:
                has_pcv_high = any(
                    f.get("parameter") == "PCV" and f.get("status") == "High"
                    for f in abnormal_findings
                )
                if has_pcv_high:
                    summary = "Mild abnormalities were detected including low hemoglobin and elevated PCV. Follow-up with a healthcare professional is recommended."
                else:
                    summary = "Mild abnormalities suggest possible anemia and should be monitored."
                return {"title": "Possible Mild Anemia", "summary": summary}
            else:
                return {
                    "title": "Mild Abnormalities Detected",
                    "summary": "Some blood parameters are outside the normal range and may require follow-up.",
                }

        elif severity == "Moderate":
            return {
                "title": "Moderate Blood Abnormalities",
                "summary": "Several parameters require medical review.",
            }

        elif severity == "Severe":
            return {
                "title": "Significant Blood Abnormalities",
                "summary": "Immediate medical consultation is recommended.",
            }

        return {
            "title": "Blood Abnormalities Detected",
            "summary": "Abnormal blood parameters require review with a healthcare provider.",
        }

    def generateExplaination(
        self,
        prediction_name,
        values,
        severity,
        score,
        abnormal_findings,
        normal_findings,
    ):
        return self.ai_provider.generate_explanation(
            prediction_name=prediction_name,
            values=values,
            severity=severity,
            score=score,
            abnormal_findings=abnormal_findings,
            normal_findings=normal_findings
        )


# if __name__ == "__main__":
#     # --------TESTING----------

#     # Initializing the backend
#     initBackend = Backend()

#     # setting up the dataset
#     initBackend.setDataset("medical_dataset.xlsx")

#     # training a model
#     initBackend.trainModel()

#     # loading the .pkl file which was created after training a model
#     initBackend.loadModel()

#     # storing extracted pdf content in a variable valu
#     valu = initBackend.extractPdfValues("sampleReport.pdf")

#     # storing predicted values inside a variable prediction
#     prediction = initBackend.predict(valu)

#     # mapping the predicted value with a specific disease
#     prediction_name = initBackend.getPredictionName(prediction)

#     # finally using Google Gemini API to generate an output
#     print(initBackend.generateExplaination(prediction_name, valu))
