"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, Shield } from "lucide-react";

interface UploadCardProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  isBackendConnected?: boolean | null;
}

export default function UploadCard({
  onUpload,
  isLoading,
  isBackendConnected = null,
}: UploadCardProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBackendConnected === false) {
      setIsDragActive(false);
      return;
    }
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFile = (file: File | null) => {
    if (!file) return;
    
    if (isBackendConnected === false) {
      setError("Cannot upload report: The backend API server is offline. Please start the server to enable analysis.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF medical report.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setError(null);
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isBackendConnected === false) {
      setError("Cannot upload report: The backend API server is offline.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isBackendConnected === false) {
      setError("Cannot upload report: The backend API server is offline.");
      return;
    }
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (isBackendConnected === false) {
      setError("Cannot upload report: The backend API server is offline.");
      return;
    }
    inputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto z-10">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf"
        onChange={handleChange}
        disabled={isLoading || isBackendConnected === false}
      />

      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative overflow-hidden rounded-2xl p-12 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 shadow-sm ${
          isBackendConnected === false
            ? "border-slate-300 bg-slate-100 cursor-not-allowed opacity-60"
            : isDragActive
            ? "border-primary bg-primary-light shadow-md cursor-pointer"
            : "border-slate-300 bg-white hover:border-primary hover:bg-slate-50/20 hover:shadow-md cursor-pointer"
        }`}
        whileHover={isBackendConnected === false ? {} : { y: -2 }}
        whileTap={isBackendConnected === false ? {} : { scale: 0.995 }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-6">
          <motion.div
            className={`p-4 rounded-xl ${
              isDragActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
            }`}
            animate={{
              y: isDragActive ? -4 : 0,
              scale: isDragActive ? 1.05 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Upload className="w-7 h-7" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
              {isDragActive ? "Drop your report here" : "Upload Blood Test Report"}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Drag and drop your blood test PDF here, or{" "}
              <span className="text-primary font-semibold hover:underline">browse files</span>.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-3 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>PDF reports up to 10MB</span>
            </div>
            
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Data is analyzed securely and never stored</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start space-x-3 text-rose-800 text-xs"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="text-rose-600 hover:text-rose-800 font-bold ml-4"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
