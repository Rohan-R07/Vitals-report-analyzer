"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { AbnormalFinding } from "../../types";

interface BiomarkerCardProps {
  finding: AbnormalFinding;
}

interface ReferenceRange {
  min: number;
  max: number;
  unit: string;
  fullName: string;
}

const PARAMETER_RANGES: Record<string, ReferenceRange> = {
  "wbc": { min: 4.0, max: 11.0, unit: "x10³/µL", fullName: "White Blood Cell Count" },
  "rbc": { min: 4.0, max: 6.0, unit: "x10⁶/µL", fullName: "Red Blood Cell Count" },
  "hemoglobin": { min: 13.5, max: 17.5, unit: "g/dL", fullName: "Hemoglobin" },
  "hgb": { min: 13.5, max: 17.5, unit: "g/dL", fullName: "Hemoglobin" },
  "hct": { min: 36.0, max: 50.0, unit: "%", fullName: "Packed Cell Volume (Hematocrit)" },
  "pcv": { min: 36.0, max: 50.0, unit: "%", fullName: "Packed Cell Volume (Hematocrit)" },
  "mcv": { min: 80.0, max: 100.0, unit: "fL", fullName: "Mean Corpuscular Volume" },
  "mch": { min: 27.0, max: 33.0, unit: "pg", fullName: "Mean Corpuscular Hemoglobin" },
  "mchc": { min: 32.0, max: 36.0, unit: "g/dL", fullName: "Mean Corpuscular Hemoglobin Concentration" },
  "plt": { min: 155.0, max: 450.0, unit: "x10³/µL", fullName: "Platelet Count" },
  "platelets": { min: 155.0, max: 450.0, unit: "x10³/µL", fullName: "Platelet Count" },
};

export default function BiomarkerCard({ finding }: BiomarkerCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Safely extract numeric value
  const value = typeof finding.value === "number" ? finding.value : parseFloat(finding.value || "0");
  const paramKey = finding.parameter.toLowerCase().trim();
  const range = PARAMETER_RANGES[paramKey] || { min: 0, max: 100, unit: "", fullName: finding.parameter };

  // Calculate visual scale positions
  // Scale range goes from 60% of min to 140% of max to provide padding on both sides
  const scaleMin = range.min * 0.6;
  const scaleMax = range.max * 1.4;
  const pointerPos = Math.min(97, Math.max(3, ((value - scaleMin) / (scaleMax - scaleMin)) * 100));
  const normalLeft = ((range.min - scaleMin) / (scaleMax - scaleMin)) * 100;
  const normalWidth = ((range.max - range.min) / (scaleMax - scaleMin)) * 100;

  const statusType = finding.status.toLowerCase();
  const isNormal = statusType === "normal";
  const isLow = statusType === "low";
  const isHigh = statusType === "high";
  const isBorderline = statusType === "borderline";

  // Determine status color styling
  const getStatusStyles = () => {
    if (isNormal) {
      return {
        badge: "bg-health-optimal/10 text-health-optimal border-health-optimal/20",
        indicator: "bg-health-optimal",
        border: "border-slate-200/60 hover:border-health-optimal/30",
        icon: <CheckCircle2 className="w-4 h-4 text-health-optimal" />,
      };
    }
    if (isBorderline) {
      return {
        badge: "bg-health-warning/10 text-health-warning border-health-warning/20",
        indicator: "bg-health-warning",
        border: "border-health-warning/20 hover:border-health-warning/40",
        icon: <AlertTriangle className="w-4 h-4 text-health-warning" />,
      };
    }
    if (isLow || isHigh) {
      return {
        badge: "bg-health-danger/10 text-health-danger border-health-danger/20",
        indicator: "bg-health-danger",
        border: "border-health-danger/20 hover:border-health-danger/40",
        icon: <AlertCircle className="w-4 h-4 text-health-danger" />,
      };
    }
    return {
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      indicator: "bg-slate-500",
      border: "border-slate-200 hover:border-slate-300",
      icon: <AlertCircle className="w-4 h-4 text-slate-500" />,
    };
  };

  const styles = getStatusStyles();

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all duration-300 ${styles.border} ${
        isOpen ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="flex flex-col space-y-5">
        {/* Top details Row */}
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {range.fullName}
            </span>
            <h4 className="text-base font-semibold text-slate-900">
              {finding.parameter}
            </h4>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="text-right">
              <span className="text-base font-bold text-slate-900">
                {value}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {range.unit}
              </span>
            </div>
            
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${styles.badge}`}>
              {finding.status}
            </span>
            
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-400 flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </div>

        {/* Visual Range Indicator Bar */}
        <div className="space-y-2 py-1">
          <div className="relative h-2 w-full bg-slate-100 rounded-full">
            {/* Healthy normal range overlay */}
            <div
              className="absolute top-0 bottom-0 bg-primary/10 border-x border-primary/10"
              style={{ left: `${normalLeft}%`, width: `${normalWidth}%` }}
            />
            {/* Measured Value Pointer */}
            <motion.div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center -ml-2 ${styles.indicator}`}
              style={{ left: `${pointerPos}%` }}
              layoutId={`pointer-${finding.parameter}`}
            />
          </div>

          {/* Reference range scale text labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
            <span>Low Range</span>
            <span className="text-slate-500 font-semibold">
              Normal: {range.min} - {range.max} {range.unit}
            </span>
            <span>High Range</span>
          </div>
        </div>

        {/* Collapsible content (progressive disclosure) */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-slate-100 pt-4"
              onClick={(e) => e.stopPropagation()} // Prevent closing card when clicking contents
            >
              <div className="flex items-start space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200/40">
                <div className="mt-0.5 flex-shrink-0">
                  {styles.icon}
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Clinical Insight
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {finding.explanation || "This parameter is monitored to evaluate standard cellular distributions and blood parameters."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
