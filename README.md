
---

## Key Features

1. **Deterministic PDF Extraction & Normalization**: 
   * Custom parser using footnote-priority regex rules to skip superscript indices (e.g. `Hematocrit\xa001 27.3` -> extracts `27.3` instead of `01` or `1.0`).
   * Automatically normalizes non-standard unit formats for WBC and Platelet counts (e.g., dividing absolute values by `1000.0` to standardize standard ranges).
2. **Machine Learning Anemia Classifier**: 
   * Automatically normalizes non-standard unit formats for WBC, RBC, and Platelet counts to standardize standard ranges.
   * Handles flag noise (e.g. `Alert`, `Critical`, `Low`, `High`) in between values.
2. **Automated OCR Fallback**:
   * Incorporates a robust OCR fallback (using PyMuPDF and EasyOCR) to handle low-resolution scanned reports when digital text extraction is insufficient.
3. **Machine Learning Anemia Classifier**: 
   * Runs a `RandomForestClassifier` model trained on clinical hematology metrics to predict specific anemia profiles (`Normal`, `Hemoglobin Anemia`, `Iron Deficiency Anemia`, `Folate Deficiency Anemia`, `Vitamin B12 Deficiency Anemia`).
3. **Programmatic Calculations Engine**:
4. **Programmatic Calculations Engine**:
   * Central configuration maps CBC parameters against normal and critical thresholds.
   * Computes Physiological Score, Clinical Severity (`Normal`, `Mild`, `Moderate`, `Severe`), Risk Level (`Low`, `Moderate`, `High`), and groups `Abnormal Findings` and `Normal Findings` programmatically.
   * Derives a consistent, contradiction-free **Primary Analysis** title and summary.
4. **AI recommendation pipeline**:
5. **AI Recommendation Pipeline**:
   * Feed-forward pipeline that forwards calculated indices directly into Hugging Face’s Llama 3.1 LLM to compile formatted lifestyle recommendations (Specialist Referrals, Diet plans, Daily Routines, Exercise, Hydration) in structured JSON format without hallucinations.
5. **High-Fidelity Dashboard Interface**:
   * Interactive dashboard rendering scores, abnormal findings tables, exercise routines, water logs, and print-ready reports.
6. **Report Validation & Custom Dialog Alerts**:
6. **Premium Medical Light Theme**:
   * Modern, clean, hospital/laboratory-themed design using soft clinic colors, cyan shadows, and elegant teal glassmorphism cards.
7. **Report Validation & Custom Dialog Alerts**:
   * Detects non-CBC PDF files (e.g. bills, resumes) and serves a high-fidelity modal dialog identifying missing expected clinical parameters (WBC, RBC, Hemoglobin, PCV, MCV, MCH, MCHC, PLT).

---
@@ -33,25 +43,27 @@ Below is the complete data flow diagram of the report processing pipeline:
```mermaid
graph TD
    A[User Uploads PDF] --> B[PyPDF Text Extraction]
    B --> C[Regex Extraction & Priority Footnote Matching]
    C --> D[WBC / PLT Value Normalization]
    D --> E[Trained Random Forest Predictor]
    D --> F[Reference Ranges Calculations Engine]
    B -->|Confidence < 70%| C[OCR Fallback: PyMuPDF & EasyOCR]
    B -->|Confidence >= 70%| D[Regex Extraction & Priority Footnote Matching]
    C --> D
    D --> E[WBC / RBC / PLT Value Normalization]
    E --> F[Trained Random Forest Predictor]
    E --> G[Reference Ranges Calculations Engine]
    
    F -->|Physiological Score| G[Diagnostic Compiler]
    F -->|Abnormal/Normal Findings| G
    F -->|Clinical Severity| G
    F -->|Risk Level| G
    E -->|Predicted Anemia Class| G
    G -->|Physiological Score| H[Diagnostic Compiler]
    G -->|Abnormal/Normal Findings| H
    G -->|Clinical Severity| H
    G -->|Risk Level| H
    F -->|Predicted Anemia Class| H
    
    G --> H[Hugging Face Llama 3.1 Recommendations Pipeline]
    H -->|Lifestyle JSON Response| I[FastAPI REST Response]
    I --> J[Next.js Premium Patient Dashboard]
    H --> I[Hugging Face Llama 3.1 Recommendations Pipeline]
    I -->|Lifestyle JSON Response| J[FastAPI REST Response]
    J --> K[Next.js Premium Patient Dashboard]
    
    style A fill:#0c4a6e,stroke:#0284c7,stroke-width:2px,color:#fff
    style E fill:#4c1d95,stroke:#7c3aed,stroke-width:2px,color:#fff
    style H fill:#14532d,stroke:#16a34a,stroke-width:2px,color:#fff
    style J fill:#1e1b4b,stroke:#4f46e5,stroke-width:2px,color:#fff
    style A fill:#0d9488,stroke:#0f766e,stroke-width:2px,color:#fff
    style F fill:#4c1d95,stroke:#7c3aed,stroke-width:2px,color:#fff
    style I fill:#14532d,stroke:#16a34a,stroke-width:2px,color:#fff
    style K fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff
```

---
@@ -73,7 +85,7 @@ Ai-medical-analyser/
│   ├── types/                  # TS schemas & normalizations
│   ├── lib/                    # API network request helpers
│   └── globals.css             # Styling system & animations
├── public/                     # Public assets
├── public/                     # Public assets & screenshots
├── medical_dataset.xlsx        # Excel dataset for RandomForest training
├── .env                        # Local environment credentials (HuggingFace token)
├── package.json                # Frontend dependencies & scripts
@@ -152,11 +164,5 @@ The backend uses a Hugging Face hosted Llama model to create structured, explain

## Screenshots

### Home Upload & Analysis Page
![Home Upload Page Screenshot](https://via.placeholder.com/800x450.png?text=Home+Upload+Page+Screenshot)

### Patient Diagnostics Dashboard
![Patient Diagnostics Dashboard Screenshot](https://via.placeholder.com/800x450.png?text=Patient+Diagnostics+Dashboard+Screenshot)

### Invalid Report Type Validation Dialog
![Validation Dialog Screenshot](https://via.placeholder.com/800x450.png?text=Invalid+Report+Validation+Dialog+Screenshot)
### Home Upload & Analysis Page (Light Medical Theme)
![Home Page](public/screenshot_light_theme.png)