"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, User, ShieldAlert, Sparkles } from "lucide-react";
import { MedicalReportData, normalizeReportData } from "../types";

// Import components
import OverviewCard from "../components/OverviewCard";
import HealthScoreCard from "../components/HealthScoreCard";
import AbnormalFindingsCard from "../components/AbnormalFindingsCard";
import DietPlannerCard from "../components/DietPlannerCard";
import DailyRoutineCard from "../components/DailyRoutineCard";
import SpecialistCard from "../components/SpecialistCard";
import ExerciseCard from "../components/ExerciseCard";
import HydrationCard from "../components/HydrationCard";
import SummaryCard from "../components/SummaryCard";

export default function Dashboard() {
  const router = useRouter();
  const [reportData, setReportData] = useState<MedicalReportData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rawData = localStorage.getItem("medicalReportData");
    if (!rawData) {
      // If no data is present, send the user back to upload first
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      setReportData(parsed);
      setIsReady(true);
    } catch (e) {
      console.error("Failed to parse report data from localStorage", e);
      router.replace("/");
    }
  }, [router]);

  if (!isReady || !reportData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#040814]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Loading physiological metrics...</p>
        </div>
      </div>
    );
  }

  // Normalize data safely using type schema
  const data = normalizeReportData(reportData);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-8 md:py-12 relative overflow-hidden bg-[#040814]">
      {/* Background Blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full mx-auto space-y-8 z-10 flex-1">
        {/* Dashboard Header Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-900/60">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                localStorage.removeItem("medicalReportData");
                router.push("/");
              }}
              className="p-2.5 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800/40 hover:border-slate-700/60 transition-all duration-200"
              title="Upload new report"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest bg-sky-500/10 border border-sky-500/15 px-2 py-0.5 rounded-md">
                  Patient Dashboard
                </span>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/15 px-2 py-0.5 rounded-md flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>AI Diagnostics</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold font-heading text-white">Diagnostics Report Summary</h1>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/60">
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700/40">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Active Analysis</span>
              <span className="text-xs font-bold text-slate-300">CBC Panel Report</span>
            </div>
          </div>
        </header>

        {/* Dashboard Core Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1: Overview */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <OverviewCard
              condition={data.primary_analysis.title}
              severity={data.severity}
              summary={data.primary_analysis.summary}
            />
          </motion.div>

          {/* Card 2: Physiological score dial */}
          <motion.div variants={itemVariants}>
            <HealthScoreCard
              severity={data.severity}
              abnormalCount={data.abnormal_findings?.length || 0}
              score={data.overview?.physiological_score}
            />
          </motion.div>

          {/* Card 3: Abnormal Findings table */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <AbnormalFindingsCard findings={data.abnormal_findings || []} />
          </motion.div>

          {/* Card 4: Recommended specialist */}
          <motion.div variants={itemVariants}>
            <SpecialistCard specialist={data.recommended_specialist} />
          </motion.div>

          {/* Card 5: Diet schedule & Foods list */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <DietPlannerCard
              diet={data.diet_plan}
              foodsToPrefer={data.foods_to_prefer}
              foodsToLimit={data.foods_to_limit}
            />
          </motion.div>

          {/* Card 6: Daily water tracker */}
          <motion.div variants={itemVariants}>
            <HydrationCard hydration={data.hydration} />
          </motion.div>

          {/* Card 7: Routine schedule timeline */}
          <motion.div variants={itemVariants}>
            <DailyRoutineCard routine={data.daily_routine} />
          </motion.div>

          {/* Card 8: Exercise details */}
          <motion.div variants={itemVariants}>
            <ExerciseCard exercise={data.exercise} />
          </motion.div>

          {/* Card 9: Consultation guidelines / print trigger */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <SummaryCard
              preventionTips={data.prevention_tips}
              warningSigns={data.warning_signs}
              followUpTests={data.follow_up_tests}
              finalSummary={data.final_summary}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <footer className="max-w-6xl w-full mx-auto text-center z-10 pt-12 mt-12 border-t border-slate-900/60 flex items-center justify-center text-xs text-slate-500 font-medium">
        <p className="text-[10px] text-slate-600 max-w-sm leading-normal">
          Consult standard clinical parameters for verifying blood panels. AI estimates do not substitute formal
          pathological diagnoses.
        </p>
      </footer>
    </div>
  );
}
