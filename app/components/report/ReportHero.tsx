"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface ReportHeroProps {
  score: number;
  condition: string;
  severity: string;
  summary: string;
  onBack: () => void;
}

export default function ReportHero({ score, condition, severity, summary, onBack }: ReportHeroProps) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 90) return "stroke-health-optimal text-health-optimal";
    if (val >= 70) return "stroke-health-warning text-health-warning";
    return "stroke-health-danger text-health-danger";
  };

  const getScoreLabel = (val: number) => {
    if (val >= 90) return "Optimal";
    if (val >= 70) return "Needs Monitoring";
    return "Needs Attention";
  };

  const isSevere = severity.toLowerCase() === "severe" || score < 60;

  return (
    <div className="min-h-[85vh] flex flex-col justify-between py-10 px-6 md:px-16 relative bg-slate-50">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back button and Active status header */}
      <header className="flex justify-between items-center w-full max-w-4xl mx-auto mb-8 z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Upload Another Report</span>
        </button>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
          Active Analysis Summary
        </span>
      </header>

      {/* Critical Alert Warning Bar */}
      {isSevere && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto w-full mb-6 p-5 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-3.5 text-rose-800 text-xs shadow-sm z-10"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-rose-900">Urgent Medical Review Advisable</span>
            <p className="text-slate-600 leading-relaxed font-normal">
              Multiple out-of-range parameters have been flagged in your report. We advise showing these results to a licensed physician or general practitioner.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Hero block */}
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col items-center justify-center text-center space-y-8 my-auto z-10">
        {/* Animated Radial Score Dial */}
        <div className="relative w-36 h-36 flex items-center justify-center bg-white rounded-full p-2 shadow-sm border border-slate-200/50">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="68"
              cy="68"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="7"
              fill="transparent"
            />
            <motion.circle
              cx="68"
              cy="68"
              r={radius}
              className={getScoreColor(score).split(" ")[0]}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute text-center flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-slate-900 font-heading">
              {score}
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Health Score
            </span>
          </div>
        </div>

        {/* Condition Title and Severity Pill */}
        <div className="space-y-5">
          <div className="flex flex-col items-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-tight max-w-lg">
              {condition}
            </h1>
            
            <div className="flex items-center space-x-2.5">
              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider ${
                isSevere
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : severity.toLowerCase() === "normal"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {severity} Severity
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {getScoreLabel(score)} Status
              </span>
            </div>
          </div>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-normal">
            {summary}
          </p>
        </div>
      </div>

      {/* Downward indicator */}
      <footer className="text-center pt-8 z-10 no-print">
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="inline-flex flex-col items-center space-y-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <span className="text-[9px] font-bold uppercase tracking-widest">Scroll to explore details</span>
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </footer>
    </div>
  );
}
