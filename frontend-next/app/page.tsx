"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Brain, Salad, Activity, Stethoscope, Sparkles, ShieldAlert } from "lucide-react";
import UploadCard from "./components/UploadCard";
import { analyzeReport } from "./lib/api";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadingSteps = [
    "Extracting blood panel markers from PDF report...",
    "Executing RandomForest diagnostic classifier...",
    "Generating AI-guided lifestyle and diet plans...",
    "Preparing your premium wellness dashboard...",
  ];

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;
    let stepTimer: NodeJS.Timeout;

    if (isLoading) {
      // Simulate progress bar increments
      progressTimer = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.random() * 4 + 1;
          return Math.min(98, prev + increment);
        });
      }, 400);

      // Transition through loading step texts
      stepTimer = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= loadingSteps.length - 1) return prev;
          return prev + 1;
        });
      }, 3500);
    } else {
      setLoadingProgress(0);
      setLoadingStep(0);
    }

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [isLoading]);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setApiError(null);
    setLoadingProgress(5);
    setLoadingStep(0);

    try {
      const result = await analyzeReport(file);
      setLoadingProgress(100);
      // Wait briefly for progress bar to hit 100%
      setTimeout(() => {
        localStorage.setItem("medicalReportData", JSON.stringify(result));
        router.push("/dashboard");
      }, 800);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred during analysis.");
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-sky-400" />,
      title: "PDF Report Extraction",
      desc: "Instantly extracts complex diagnostic metrics directly from standard laboratory report PDFs.",
    },
    {
      icon: <Brain className="w-6 h-6 text-violet-400" />,
      title: "ML Risk Prediction",
      desc: "Classifies hematological markers against machine learning models to identify anomaly indicators.",
    },
    {
      icon: <Salad className="w-6 h-6 text-emerald-400" />,
      title: "Personalized Nutrition",
      desc: "Tailors a complete diet plan targeting deficiencies with explicit foods to prefer and limit.",
    },
    {
      icon: <Activity className="w-6 h-6 text-amber-400" />,
      title: "Daily Wellness Routines",
      desc: "Organizes your day into a time-based wellness schedule for active monitoring and recovery.",
    },
    {
      icon: <Stethoscope className="w-6 h-6 text-rose-400" />,
      title: "Specialist Referrals",
      desc: "Recommends key clinical specialists for consultations based on identified physiological findings.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-12 md:py-24 relative overflow-hidden">
      {/* Background radial overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center z-10 mb-16">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-white">
            Ai-medical-report-<span className="text-sky-400 font-semibold">analyzer</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800/80 text-slate-400 font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
          API Connected
        </div>
      </header>

      {/* Main Core Section */}
      <main className="max-w-4xl w-full mx-auto flex-1 flex flex-col items-center justify-center text-center space-y-12 z-10">
        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.div
              key="hero-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-12 w-full"
            >
              {/* Hero Header */}
              <div className="space-y-6 max-w-2xl mx-auto">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-sky-400"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Powered Diagnostics Evaluation</span>
                </motion.div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight leading-none">
                  AI Medical <span className="text-gradient-cyan">Report Analyzer</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                  Upload your laboratory blood test report PDF. Get immediate physiological metrics classification,
                  personalized diet plans, daily hydration checklists, and clinical guidance.
                </p>
              </div>

              {/* File Upload Zone */}
              <UploadCard onUpload={handleUpload} isLoading={isLoading} />

              {/* API error notifier */}
              {apiError && (
                <div className="max-w-2xl mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300">
                  {apiError}
                </div>
              )}

              {/* Features Showcase */}
              <div className="pt-16 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold font-heading text-white">Full-Stack Features</h2>
                  <p className="text-xs text-slate-500">Comprehensive diagnostic pipelines to track vital biomarkers</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="glass-panel p-6 rounded-2xl space-y-4 hover:border-slate-700/60 hover:bg-slate-900/30 transition-all duration-200"
                    >
                      <div className="p-3 bg-slate-900/80 rounded-xl w-fit border border-slate-800">
                        {feature.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-200">{feature.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel max-w-md w-full p-8 rounded-3xl flex flex-col items-center justify-center space-y-8"
            >
              {/* Spinning Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-4 border-t-sky-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                />
                <Brain className="w-8 h-8 text-sky-400" />
              </div>

              {/* Status & Progress */}
              <div className="w-full text-center space-y-3">
                <h3 className="text-lg font-bold font-heading text-slate-100">
                  Analyzing Report
                </h3>
                
                {/* Progress bar container */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <motion.div
                    className="bg-sky-500 h-full rounded-full"
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                  <span className="text-sky-400/80">{loadingSteps[loadingStep]}</span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl w-full mx-auto text-center z-10 pt-16 border-t border-slate-900/60 flex items-center justify-center text-xs text-slate-500 font-medium">
        <p className="text-[10px] text-slate-600 max-w-md leading-normal">
          Disclaimer: This app is powered by AI evaluation models. It is for informational and educational use only,
          not a clinical diagnosis. Always consult with a licensed doctor.
        </p>
      </footer>

      {/* Error Modal */}
      <AnimatePresence>
        {apiError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApiError(null)}
              className="absolute inset-0 bg-[#02040a]/80 backdrop-blur-md"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass-panel w-full max-w-lg p-8 rounded-3xl relative overflow-hidden border border-rose-500/20 shadow-2xl shadow-rose-950/20 z-10 space-y-6"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-rose-500/10" />

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center shadow-lg shadow-rose-500/10 text-rose-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading text-slate-100">
                    Invalid Report Detected
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                    {apiError}
                  </p>
                </div>
              </div>

              {/* CBC Parameters Checklist */}
              <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expected Report Parameters
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>WBC (White Blood Cells)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>RBC (Red Blood Cells)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>Hemoglobin (Hb)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>PCV / Hematocrit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>MCV, MCH, MCHC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60" />
                    <span>Platelet Count (PLT)</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setApiError(null)}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-750 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/10 hover:shadow-rose-600/20 active:scale-95 transition-all duration-200"
                >
                  Try Another File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
