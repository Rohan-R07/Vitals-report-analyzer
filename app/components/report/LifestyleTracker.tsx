"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Salad, CalendarDays, GlassWater, Trophy, Dumbbell, 
  Moon, CheckCircle2, ShieldAlert, Plus, Minus
} from "lucide-react";
import { DietPlan, DailyRoutineItem, HydrationInfo, ExerciseInfo } from "../../types";

interface LifestyleTrackerProps {
  diet: DietPlan;
  foodsToPrefer?: string[];
  foodsToLimit?: string[];
  routine: DailyRoutineItem[];
  hydration: HydrationInfo;
  exercise: ExerciseInfo;
  preventionTips: string[];
}

export default function LifestyleTracker({
  diet,
  foodsToPrefer = [],
  foodsToLimit = [],
  routine = [],
  hydration,
  exercise,
  preventionTips = [],
}: LifestyleTrackerProps) {
  const [activeTab, setActiveTab] = useState<"nutrition" | "routine" | "hydration" | "prevention">("nutrition");

  // State for interactive features
  const [waterCount, setWaterCount] = useState(0);
  const targetGlasses = parseInt(hydration.target) || 8;

  const [checkedRoutine, setCheckedRoutine] = useState<Record<number, boolean>>({});
  const [checkedDiet, setCheckedDiet] = useState<Record<string, boolean>>({});

  const toggleRoutine = (idx: number) => {
    setCheckedRoutine(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleDietItem = (key: string) => {
    setCheckedDiet(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const incrementWater = () => {
    if (waterCount < 16) setWaterCount(waterCount + 1);
  };

  const decrementWater = () => {
    if (waterCount > 0) setWaterCount(waterCount - 1);
  };

  const completedRoutineCount = Object.values(checkedRoutine).filter(Boolean).length;
  const totalRoutineCount = routine.length || 4;

  const tabs = [
    { id: "nutrition", label: "Nutrition", icon: <Salad className="w-4 h-4" /> },
    { id: "routine", label: "Daily Routine", icon: <CalendarDays className="w-4 h-4" /> },
    { id: "hydration", label: "Hydration & Fitness", icon: <GlassWater className="w-4 h-4" /> },
    { id: "prevention", label: "Prevention", icon: <Heart className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2.5">
          <Trophy className="w-5 h-5 text-primary" />
          <span>Interactive Wellness Plan</span>
        </h2>
        <p className="text-xs text-slate-500 font-normal">
          Tailored daily actions to restore and maintain optimal blood levels
        </p>
      </div>

      {/* Tabs Segment Selector */}
      <div className="bg-slate-200/50 p-1.5 rounded-xl border border-slate-300/30 flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Tab 1: Nutrition & Meals */}
            {activeTab === "nutrition" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Diet Checklist */}
                <div className="space-y-4 bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recommended Meal Plan
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(diet).map(([meal, items]) => {
                      if (!Array.isArray(items) || items.length === 0) return null;
                      return (
                        <div key={meal} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-primary capitalize block tracking-wide">
                            {meal}
                          </span>
                          <div className="space-y-1">
                            {items.slice(0, 3).map((item, idx) => {
                              const uniqueKey = `${meal}-${idx}`;
                              const isChecked = checkedDiet[uniqueKey];
                              return (
                                <label
                                  key={idx}
                                  onClick={() => toggleDietItem(uniqueKey)}
                                  className="flex items-start space-x-2.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer select-none py-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked || false}
                                    readOnly
                                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
                                  />
                                  <span className={isChecked ? "line-through text-slate-400" : ""}>
                                    {item}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Foods guidelines */}
                <div className="space-y-5 flex flex-col justify-between">
                  {/* Foods to prefer */}
                  {foodsToPrefer.length > 0 && (
                    <div className="bg-health-optimal/5 border border-health-optimal/10 p-6 rounded-2xl space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold text-health-optimal flex items-center space-x-1.5 uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-health-optimal" />
                        <span>Foods to Prefer</span>
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-normal leading-relaxed">
                        {foodsToPrefer.slice(0, 4).map((food, idx) => (
                          <li key={idx}>{food}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Foods to limit */}
                  {foodsToLimit.length > 0 && (
                    <div className="bg-health-danger/5 border border-health-danger/10 p-6 rounded-2xl space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold text-health-danger flex items-center space-x-1.5 uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-health-danger" />
                        <span>Foods to Avoid / Limit</span>
                      </h4>
                      <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-normal leading-relaxed">
                        {foodsToLimit.slice(0, 4).map((food, idx) => (
                          <li key={idx}>{food}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Daily Routine Timeline */}
            {activeTab === "routine" && (
              <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-6">
                {/* Routine Progress indicator */}
                <div className="flex justify-between items-center bg-[#f0f5f2] p-5 rounded-xl border border-slate-200/40">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Routine Checklist
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {completedRoutineCount} of {totalRoutineCount} Tasks Completed
                    </span>
                  </div>
                  <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${(completedRoutineCount / totalRoutineCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Vertical routine list */}
                <div className="relative border-l border-slate-200/80 ml-3 pl-6 space-y-5 py-1">
                  {routine.map((item, idx) => {
                    const isChecked = checkedRoutine[idx] || false;
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleRoutine(idx)}
                        className="relative group cursor-pointer flex items-start space-x-3.5 select-none"
                      >
                        {/* Status Check Circle */}
                        <div className="absolute -left-[35px] top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center transition-colors group-hover:border-primary">
                          {isChecked && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>

                        <div className={`flex-1 space-y-0.5 transition-opacity ${isChecked ? "opacity-50" : "opacity-100"}`}>
                          <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">
                            {item.time}
                          </span>
                          <p className={`text-xs text-slate-700 font-normal leading-relaxed ${isChecked ? "line-through" : ""}`}>
                            {item.activity}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Hydration & Fitness */}
            {activeTab === "hydration" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hydration Tracker */}
                <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm flex flex-col justify-between items-center text-center space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Daily Hydration Counter
                    </h3>
                    <p className="text-[10px] text-slate-500 italic max-w-xs leading-normal">
                      {hydration.tip}
                    </p>
                  </div>

                  {/* Cup graphic/filling representation */}
                  <div className="relative w-28 h-28 flex items-center justify-center bg-primary/5 rounded-full border border-primary/10 overflow-hidden">
                    <GlassWater className="w-9 h-9 text-primary z-10" />
                    {/* Water Level overlay */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-b-full transition-all duration-500 ease-in-out"
                      style={{ 
                        height: `${Math.min(100, (waterCount / targetGlasses) * 100)}%`,
                        borderTopLeftRadius: waterCount >= targetGlasses ? "9999px" : "0px",
                        borderTopRightRadius: waterCount >= targetGlasses ? "9999px" : "0px",
                      }}
                    />
                  </div>

                  <div className="space-y-3.5 w-full">
                    <div className="flex justify-center items-baseline space-x-1">
                      <span className="text-2xl font-bold text-slate-900">{waterCount}</span>
                      <span className="text-xs text-slate-400">/ {targetGlasses} glasses</span>
                    </div>

                    <div className="flex justify-center space-x-3 w-full max-w-[150px] mx-auto">
                      <button
                        onClick={decrementWater}
                        className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 transition-colors focus-visible:outline-none"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={incrementWater}
                        className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl flex items-center justify-center shadow-sm transition-colors focus-visible:outline-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exercise guidelines */}
                <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Dumbbell className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Target Fitness Goals
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Light aerobic activities aid cell oxygenation and blood circulation without stressing depleted hemoglobin.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-slate-700">Target Duration:</span>
                      <span className="font-bold text-primary">{exercise.duration}</span>
                    </div>
                    <div className="border-t border-slate-200/80 pt-2.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                        Recommended Activities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exercise.activities.map((act, idx) => (
                          <span 
                            key={idx}
                            className="bg-white border border-slate-200/60 text-[10px] text-slate-600 px-2 py-0.5 rounded-md font-medium"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Prevention */}
            {activeTab === "prevention" && (
              <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-slate-700 pb-2 border-b border-slate-100">
                  <Heart className="w-4.5 h-4.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Long-term Prevention Guidelines
                  </span>
                </div>

                <div className="space-y-3">
                  {preventionTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs text-slate-600 leading-relaxed font-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                {/* Sleep reminder card */}
                <div className="mt-4 p-5 bg-[#f0f5f2] border border-slate-200/40 rounded-xl flex items-start space-x-3.5">
                  <Moon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide block">
                      Prioritize Sleep Recovery
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      Aim for 7 to 9 hours of uninterrupted restful sleep. Blood cells recover and regenerate primarily during deep sleep cycles.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
