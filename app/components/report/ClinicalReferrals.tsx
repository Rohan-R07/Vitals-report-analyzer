"use client";

import React from "react";
import { motion } from "framer-motion";
import { Stethoscope, ArrowRight, ShieldCheck } from "lucide-react";
import { Specialist } from "../../types";

interface ClinicalReferralsProps {
  specialist: Specialist;
  followUpTests: string[];
  severity: string;
  nextSteps?: string[];
}

export default function ClinicalReferrals({
  specialist,
  followUpTests,
  severity,
  nextSteps = [],
}: ClinicalReferralsProps) {
  const sevLower = severity.toLowerCase();
  const isSevere = sevLower.includes("severe") || sevLower.includes("high");
  const isModerate = sevLower.includes("moderate") || sevLower.includes("warning") || sevLower.includes("anemia");

  // Determine urgency level
  const getUrgency = () => {
    if (isSevere) {
      return {
        label: "High Urgency",
        desc: "Schedule a consultation within 48 to 72 hours.",
        color: "bg-health-danger/10 text-health-danger border-health-danger/20",
      };
    }
    if (isModerate) {
      return {
        label: "Medium Urgency",
        desc: "Schedule a consultation within 1 to 2 weeks.",
        color: "bg-health-warning/10 text-health-warning border-health-warning/20",
      };
    }
    return {
      label: "Routine",
      desc: "Discuss these findings during your next wellness visit.",
      color: "bg-health-optimal/10 text-health-optimal border-health-optimal/20",
    };
  };

  const urgency = getUrgency();

  // Combine followUpTests and nextSteps if needed, fallback to defaults
  const activeFollowUps = followUpTests.length > 0 ? followUpTests : ["Repeat Complete Blood Count (CBC) test in 3 months."];
  const activeNextSteps = nextSteps.length > 0 ? nextSteps : [
    "Obtain a printed copy of this diagnostic summary.",
    "Schedule a consultation with your primary physician.",
    "Maintain your wellness routine and hydration tracking.",
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2.5">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span>Clinical Specialist Referral</span>
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          Professional medical direction and secondary verification actions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specialist Card */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition-all duration-300">
          <div className="space-y-3.5">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Recommended Specialty
                </span>
                <h4 className="text-base font-semibold text-slate-900">
                  {specialist.doctor_type || specialist.name || "General Practitioner"}
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${urgency.color}`}>
                {urgency.label}
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {specialist.reason || "A general consultation is recommended to review these parameters and ensure your counts remain stable."}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Timeline Guideline
            </span>
            <p className="text-[11px] text-slate-500 font-normal leading-normal">
              {urgency.desc}
            </p>
          </div>
        </div>

        {/* Action Steps Card */}
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition-all duration-300">
          {/* Follow up tests */}
          <div className="space-y-3.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Suggested Follow-up Tests
            </span>
            <div className="space-y-2">
              {activeFollowUps.slice(0, 3).map((test, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-600 font-normal leading-relaxed">
                  <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{test}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next steps checklist */}
          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Recommended Next Steps
            </span>
            <div className="space-y-2">
              {activeNextSteps.slice(0, 3).map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-600 font-normal leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-health-optimal flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
