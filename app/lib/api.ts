import { MedicalReportData } from "../types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

/**
 * Uploads a PDF report file to the FastAPI backend for analysis
 * @param file The PDF report file
 */
export async function uploadReport(file: File): Promise<MedicalReportData> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (Status ${response.status})`);
  }

  return response.json();
}

/**
 * Alias for uploadReport, as specified in design requirements
 * @param file The PDF report file
 */
export async function analyzeReport(file: File): Promise<MedicalReportData> {
  return uploadReport(file);
}
