"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { MedicalReportData, normalizeReportData } from "../types";

// Import new guided components
import ReportHero from "../components/report/ReportHero";
import BiomarkerList from "../components/report/BiomarkerList";
import ClinicalInsights from "../components/report/ClinicalInsights";
import LifestyleTracker from "../components/report/LifestyleTracker";
import ClinicalReferrals from "../components/report/ClinicalReferrals";
import ReportActions from "../components/report/ReportActions";

export default function Dashboard() {
  const router = useRouter();
  const [reportData, setReportData] = useState<MedicalReportData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rawData = localStorage.getItem("medicalReportData");
    if (!rawData) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      setReportData(parsed);
      setIsReady(true);
    } catch (e) {
      console.error("Failed to parse report data", e);
      router.replace("/");
    }
  }, [router]);

  const handleRestoreReport = (restoredData: MedicalReportData) => {
    // Set in state to trigger live update
    setReportData(restoredData);
    // Write back to main local storage slot so refreshing keeps it active
    localStorage.setItem("medicalReportData", JSON.stringify(restoredData));
    // Scroll smoothly back to top of the report
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToUpload = () => {
    localStorage.removeItem("medicalReportData");
    router.push("/");
  };

  if (!isReady || !reportData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Preparing guided insights...</p>
        </div>
      </div>
    );
  }

  // Normalize report parameters safely using type helper
  const data = normalizeReportData(reportData);

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 text-slate-900 min-h-screen">
      
      {/* 1. HERO SUMMARY SECTION */}
      <ReportHero
        score={data.overview?.physiological_score ?? 100}
        condition={data.primary_analysis?.title || "Optimal Health Profile"}
        severity={data.severity || "Normal"}
        summary={data.primary_analysis?.summary || data.condition_summary || "No specific summary details available."}
        onBack={handleBackToUpload}
      />

      {/* SECTION WRAPPER: Centered fixed grid with wide margins */}
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-16 py-16 space-y-20 z-10 flex-1">
        
        {/* 2. PARAMETERS DETAIL SECTION */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <BiomarkerList
            abnormalFindings={data.abnormal_findings || []}
            normalFindings={data.normal_findings || []}
          />
        </motion.section>

        {/* 3. CONVERSATIONAL AI INSIGHTS */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ClinicalInsights
            condition={data.primary_analysis?.title || "Normal"}
            summary={data.primary_analysis?.summary || ""}
            abnormalFindings={data.abnormal_findings || []}
          />
        </motion.section>

        {/* 4. LIFESTYLE PLAN TRACKER */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <LifestyleTracker
            diet={data.diet_plan}
            foodsToPrefer={data.foods_to_prefer}
            foodsToLimit={data.foods_to_limit}
            routine={data.daily_routine}
            hydration={data.hydration}
            exercise={data.exercise}
            preventionTips={data.prevention_tips}
          />
        </motion.section>

        {/* 5. DOCTOR REFERENCE REFERRAL */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ClinicalReferrals
            specialist={data.recommended_specialist}
            followUpTests={data.follow_up_tests}
            severity={data.severity}
            nextSteps={data.next_steps}
          />
        </motion.section>

        {/* 6. SHARE AND HISTORY ACTIONS */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ReportActions
            reportData={reportData}
            onRestoreReport={handleRestoreReport}
          />
        </motion.section>

      </div>

      {/* FOOTER */}
      <footer className="max-w-[1200px] w-full mx-auto text-center z-10 py-10 mt-10 border-t border-slate-200/60 flex flex-col items-center justify-center text-[10px] text-slate-400 font-medium space-y-2 no-print">
        <p className="max-w-md leading-relaxed">
          Consult standard clinical parameters for verifying blood panels. AI estimates do not substitute formal medical or pathological diagnoses.
        </p>
      </footer>
    </div>
  );
}
