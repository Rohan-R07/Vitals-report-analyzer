import pandas
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from dotenv import load_dotenv
import joblib
from pypdf import PdfReader
import os
import regex as re
from openai import OpenAI

current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path, override=True)


class Backend:
    def __init__(self):
        self.csvData = None
        self.model = None
        self.accuracy = None

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
    def loadModel(self):
        self.model = joblib.load("anemia_model.pkl")

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

        # selelctin pdf file
        pdf = PdfReader(pdf_file)

        # creating a storing variable
        all_text = ""

        # iterating to all pages and then extracting text then finally storing it in a single variable
        for page in pdf.pages:
            all_text += page.extract_text()

        # a external dictonary  to store values
        patient_data = {}

        # The searching for these values in the pdf
        features = {
            "WBC": [
                r"Total WBC count\s+\d+\s+(\d+\.?\d*)",
                r"Total WBC count\s+(\d+\.?\d*)",
                r"WBC\s+\d+\s+(\d+\.?\d*)",
                r"WBC\s+(\d+\.?\d*)",
            ],
            "RBC": [
                r"Total RBC count\s+\d+\s+(\d+\.?\d*)",
                r"Total RBC count\s+(\d+\.?\d*)",
                r"RBC\s+\d+\s+(\d+\.?\d*)",
                r"RBC\s+(\d+\.?\d*)",
            ],
            "HGB": [
                r"Hemoglobin\s*\(Hb\)\s+\d+\s+(\d+\.?\d*)",
                r"Hemoglobin\s*\(Hb\)\s+(\d+\.?\d*)",
                r"Hemoglobin\s+\d+\s+(\d+\.?\d*)",
                r"Hemoglobin\s+(\d+\.?\d*)",
                r"HGB\s+\d+\s+(\d+\.?\d*)",
                r"HGB\s+(\d+\.?\d*)",
            ],
            "HCT": [
                r"Hematocrit\s*\(HCT\)\s+\d+\s+(\d+\.?\d*)",
                r"Hematocrit\s*\(HCT\)\s+(\d+\.?\d*)",
                r"Hematocrit\s+\d+\s+(\d+\.?\d*)",
                r"Hematocrit\s+(\d+\.?\d*)",
                r"Packed Cell Volume\s*\(PCV\)\s+\d+\s+(\d+\.?\d*)",
                r"Packed Cell Volume\s*\(PCV\)\s+(\d+\.?\d*)",
                r"PCV\s+\d+\s+(\d+\.?\d*)",
                r"PCV\s+(\d+\.?\d*)",
                r"HCT\s+\d+\s+(\d+\.?\d*)",
                r"HCT\s+(\d+\.?\d*)",
            ],
            "MCV": [
                r"Mean Corpuscular Volume\s*\(MCV\)\s+\d+\s+(\d+\.?\d*)",
                r"Mean Corpuscular Volume\s*\(MCV\)\s+(\d+\.?\d*)",
                r"MCV\s+\d+\s+(\d+\.?\d*)",
                r"MCV\s+(\d+\.?\d*)",
            ],
            "MCH": [
                r"Mean Corpuscular Hemoglobin\s+\d+\s+(\d+\.?\d*)",
                r"Mean Corpuscular Hemoglobin\s+(\d+\.?\d*)",
                r"MCH\s+\d+\s+(\d+\.?\d*)",
                r"MCH\s+(\d+\.?\d*)",
            ],
            "MCHC": [
                r"Mean Corpuscular Hemoglobin Concentration\s+\d+\s+(\d+\.?\d*)",
                r"Mean Corpuscular Hemoglobin Concentration\s+(\d+\.?\d*)",
                r"MCHC\s+\d+\s+(\d+\.?\d*)",
                r"MCHC\s+(\d+\.?\d*)",
            ],
            "PLT": [
                r"Platelet\s*Count\s+\d+\s+(\d+\.?\d*)",
                r"Platelet\s*Count\s+(\d+\.?\d*)",
                r"Platelets\s*\(PLT\)\s+\d+\s+(\d+\.?\d*)",
                r"Platelets\s*\(PLT\)\s+(\d+\.?\d*)",
                r"Platelets\s+\d+\s+(\d+\.?\d*)",
                r"Platelets\s+(\d+\.?\d*)",
                r"PLT\s+\d+\s+(\d+\.?\d*)",
                r"PLT\s+(\d+\.?\d*)",
            ],
        }

        # searching for the given features in the extracted text
        for model_name, patterns in features.items():
            for pattern in patterns:
                match = re.search(pattern, all_text, re.IGNORECASE)
                if match:
                    patient_data[model_name] = float(match.group(1))
                    print(f"{model_name} = {patient_data[model_name]}")
                    break

        # Normalization of units for WBC and Platelets (PLT) because some labs write report differently
        if "WBC" in patient_data:
            val = patient_data["WBC"]
            if val > 100.0:
                patient_data["WBC"] = round(val / 1000.0, 2)
                print(f"Normalized WBC: {val} -> {patient_data['WBC']}")

        if "PLT" in patient_data:
            val = patient_data["PLT"]
            if val > 1000.0:
                patient_data["PLT"] = round(val / 1000.0, 2)
                print(f"Normalized PLT: {val} -> {patient_data['PLT']}")

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
        hf_token = os.getenv("HF_TOKEN")
        prompt = f"""
            You are a medical report analysis API.

            Input:
            Condition: {prediction_name}
            Severity: {severity}
            Physiological Score: {score}
            Abnormal Findings: {abnormal_findings}
            Normal Findings: {normal_findings}
            Blood Values: {values}

            You MUST explain these pre-calculated physiological values. 
            Do NOT calculate any scores, severity levels, or status ratings yourself. Only explain them.

            Return ONLY valid JSON matching this exact structure:
            {{
              "specialist": {{
                "name": "",
                "reason": ""
              }},
              "diet_plan": {{
                "breakfast": [],
                "lunch": [],
                "dinner": [],
                "snacks": []
              }},
              "daily_routine": [
                {{
                  "time": "Morning",
                  "activity": ""
                }},
                {{
                  "time": "Afternoon",
                  "activity": ""
                }},
                {{
                  "time": "Evening",
                  "activity": ""
                }},
                {{
                  "time": "Night",
                  "activity": ""
                }}
              ],
              "exercise_plan": {{
                "duration": "",
                "activities": []
              }},
              "hydration": {{
                "target": "",
                "tip": ""
              }},
              "prevention_tips": [],
              "follow_up_tests": [],
              "final_summary": []
            }}

            Return ONLY valid JSON.
            Do not return markdown.
            Do not return explanations outside JSON.
            Do not wrap JSON in code blocks.

            Rules:

            * Use concise responses.
            * Use simple language.
            * No diagnosis claims.
            * No medication suggestions.
            * No legal or medical disclaimers.
            * Focus only on explaining provided values.
            * Diet must use common foods.
            * Daily routine must be realistic.
            * Maximum 3 items per list unless necessary.
            * Keep total response compact.
        """

        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=hf_token,
        )

        completion = client.chat.completions.create(
            model="meta-llama/Llama-3.1-8B-Instruct:novita",
            messages=[{"role": "user", "content": prompt}],
        )

        return completion.choices[0].message.content


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

#     # finally using hugging face tokens to generate a output
#     print(initBackend.generateExplaination(prediction_name, valu))
