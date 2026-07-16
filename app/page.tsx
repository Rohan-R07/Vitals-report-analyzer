"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Brain, Salad, Activity, Sparkles, ShieldAlert } from "lucide-react";
import UploadCard from "./components/UploadCard";
import LoadingTimeline from "./components/shared/LoadingTimeline";
import { analyzeReport } from "./lib/api";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Periodic health check on backend connection
  useEffect(() => {
    const API_BASE_URL = 
      typeof window !== "undefined" && window.location.hostname !== "localhost"
        ? ""
        : (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Pragma": "no-cache",
            "Cache-Control": "no-cache",
          },
        });
        if (res.ok) {
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (e) {
        setIsBackendConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let progressTimer: NodeJS.Timeout;

    if (isLoading) {
      // Simulate progress bar increments through stages
      progressTimer = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.random() * 6 + 1.5;
          return Math.min(98, prev + increment);
        });
      }, 350);
    } else {
      setLoadingProgress(0);
    }

    return () => {
      clearInterval(progressTimer);
    };
  }, [isLoading]);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setApiError(null);
    setLoadingProgress(5);

    try {
      const result = await analyzeReport(file);
      setLoadingProgress(100);
      // Wait briefly for progress bar to hit 100%
      setTimeout(() => {
        localStorage.setItem("medicalReportData", JSON.stringify(result));
        router.push("/dashboard");
      }, 600);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "An unexpected error occurred during report analysis.");
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "Pathological Extraction",
      desc: "Extracts CBC metrics from blood report sheets automatically using OCR and reference mappings.",
    },
    {
      icon: <Brain className="w-5 h-5 text-primary" />,
      title: "Random Forest Analysis",
      desc: "Evaluates key hematological parameters against clinical classifiers to score anemia risks.",
    },
    {
      icon: <Salad className="w-5 h-5 text-primary" />,
      title: "Intelligent Guidance",
      desc: "Uses OpenRouter Gemma-4 reasoning models to structure custom dietary and lifestyle guidelines.",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-12 md:py-20 relative overflow-hidden bg-slate-50 min-h-screen">
      {/* Background blobs for visual warmth */}
      <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="max-w-5xl w-full mx-auto flex justify-between items-center z-10 mb-16">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-[0.15em] text-slate-900 text-sm font-heading uppercase">
            V I T A L I S
          </span>
        </div>
        {isBackendConnected === true ? (
          <div className="flex items-center space-x-1.5 text-[9px] bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full border border-emerald-100 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
            API Connected
          </div>
        ) : isBackendConnected === false ? (
          <div className="flex items-center space-x-1.5 text-[9px] bg-rose-50 text-rose-700 px-3.5 py-1.5 rounded-full border border-rose-100 font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
            Backend Offline
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-[9px] bg-slate-100 text-slate-600 px-3.5 py-1.5 rounded-full border border-slate-200/60 font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
            Checking API
          </div>
        )}
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
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12 w-full"
            >
              {/* Hero Header */}
              <div className="space-y-5 max-w-2xl mx-auto">
                <div className="inline-flex items-center space-x-1.5 bg-primary-light border border-primary/10 px-4 py-1.5 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Clinical Intelligence Dashboard</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.15]">
                  Understand your blood health, <br />
                  <span className="text-primary font-bold">clearly and calmly.</span>
                </h1>
                <p className="text-slate-500 text-base leading-relaxed max-w-lg mx-auto font-normal">
                  Upload your laboratory CBC report PDF for immediate parameter visualizations, machine learning anemia classifications, and tailored wellness guidance.
                </p>
              </div>

              {/* Offline Warning Banner */}
              {isBackendConnected === false && (
                <div className="max-w-xl mx-auto p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-center justify-center space-x-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 animate-pulse" />
                  <span>The backend API server is offline. Please launch the server (<code>python index.py</code>) to run the parser.</span>
                </div>
              )}

              {/* File Upload Zone */}
              <UploadCard 
                onUpload={handleUpload} 
                isLoading={isLoading} 
                isBackendConnected={isBackendConnected} 
              />

              {/* Features Showcase */}
              <div className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
                  {features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200/50 p-6 rounded-2xl space-y-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-3 bg-slate-50 rounded-xl w-fit border border-slate-100/80">
                        {feature.icon}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-semibold text-slate-900">{feature.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-normal">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <LoadingTimeline progress={loadingProgress} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-5xl w-full mx-auto text-center z-10 pt-12 border-t border-slate-200/60 flex flex-col items-center justify-center text-[10px] text-slate-400 font-medium space-y-2">
        <p className="max-w-lg leading-relaxed">
          Disclaimer: This system is an AI companion for educational and informational purposes. It is NOT a substitute for professional medical advice, diagnostic evaluations, or treatment.
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
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-md p-8 rounded-2xl relative overflow-hidden border border-rose-100 shadow-xl z-10 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Analysis Incomplete
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-normal">
                    {apiError}
                  </p>
                </div>
              </div>

              {/* Expected checklist */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expected Blood Panel Parameters
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>WBC Count</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>RBC Count</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Hemoglobin (Hb)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>PCV / Hematocrit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>MCV, MCH, MCHC</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Platelet Count (PLT)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setApiError(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm active:scale-98 transition-all duration-200"
              >
                Try Another File
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
