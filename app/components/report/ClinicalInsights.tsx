"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquareDot, HelpCircle, Activity, Info, Eye, ClipboardCheck } from "lucide-react";
import { AbnormalFinding } from "../../types";

interface ClinicalInsightsProps {
  condition: string;
  summary: string;
  abnormalFindings: AbnormalFinding[];
}

export default function ClinicalInsights({
  condition,
  summary,
  abnormalFindings,
}: ClinicalInsightsProps) {
  const flaggedNames = abnormalFindings.map((f) => f.parameter).join(", ");
  const hasLowHgb = abnormalFindings.some((f) => f.parameter.toLowerCase().includes("hemoglobin") && f.status.toLowerCase() === "low");
  const hasLowPlt = abnormalFindings.some((f) => f.parameter.toLowerCase().includes("platelet") && f.status.toLowerCase() === "low");

  const insights = [
    {
      title: "What Happened?",
      icon: <Info className="w-4 h-4 text-primary" />,
      content: summary || `Your blood report indicates a condition classified as ${condition}. Specifically, deviations were found in: ${flaggedNames || "None"}.`,
    },
    {
      title: "Why It Matters",
      icon: <Activity className="w-4 h-4 text-primary" />,
      content: hasLowHgb
        ? "Hemoglobin is the protein in red blood cells that carries oxygen throughout your body. Low levels mean your tissues receive less oxygen, leading your heart to work harder to compensate."
        : "Complete Blood Count parameters act as primary indicators for immune function (WBC), oxygen capacity (RBC/HGB), and blood coagulation (PLT). Slight deviations shift physiological performance and cellular metabolism.",
    },
    {
      title: "Possible Symptoms",
      icon: <HelpCircle className="w-4 h-4 text-primary" />,
      content: hasLowHgb
        ? "With lower oxygen transport, common symptoms include general fatigue, mild dizziness, pale skin, cold hands or feet, and feeling short of breath during light physical tasks."
        : hasLowPlt
        ? "Low platelets (thrombocytopenia) can hinder coagulation, which might manifest as easy bruising, small red skin spots (petechiae), or prolonged bleeding from minor cuts."
        : "Typical symptoms associated with minor blood metric shifts are often subtle and include changes in energy levels, mild exhaustion, or temporary sleep disturbances.",
    },
    {
      title: "Things to Watch",
      icon: <Eye className="w-4 h-4 text-primary" />,
      content: "Keep track of physical changes: note if you feel unusually exhausted after normal routines, experience rapid heart rate, or observe new patterns of lightheadedness.",
    },
    {
      title: "Recommended Actions",
      icon: <ClipboardCheck className="w-4 h-4 text-primary" />,
      content: "Make sure to discuss these results with your practitioner, review your nutrition profiles (like iron and vitamin B12 intake), keep up a regular hydration habit, and avoid heavy stress.",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2.5">
          <MessageSquareDot className="w-5 h-5 text-primary" />
          <span>Conversational Insights</span>
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          De-mystifying your diagnostic report through a simple conversation
        </p>
      </div>

      {/* Interactive steps */}
      <div className="relative border-l border-slate-200/80 pl-6 ml-3 space-y-6 py-1">
        {insights.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="relative"
          >
            {/* Timeline Dot Indicator */}
            <span className="absolute -left-[37px] top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200/60 flex items-center justify-center shadow-sm">
              {insight.icon}
            </span>

            <div className="space-y-1.5 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-sm font-semibold text-slate-900">
                {insight.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {insight.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
