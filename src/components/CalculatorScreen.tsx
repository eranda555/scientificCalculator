/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CalcMode, AngleMode, BaseNMode } from "../types";
import { formatFloat, getFractionApproximation } from "../utils/mathEngine";

interface CalculatorScreenProps {
  expression: string;
  result: string;
  calcMode: CalcMode;
  angleMode: AngleMode;
  baseNMode: BaseNMode;
  isShift: boolean;
  isAlpha: boolean;
  isMemoryNonZero: boolean;
  showFraction: boolean; // Toggled by [S-D] key
  calScale?: "compact" | "normal" | "large" | "full";
}

export default function CalculatorScreen({
  expression,
  result,
  calcMode,
  angleMode,
  baseNMode,
  isShift,
  isAlpha,
  isMemoryNonZero,
  showFraction,
  calScale = "normal",
}: CalculatorScreenProps) {

  // Replace operator symbols for attractive classic dot-matrix display
  const formatExpression = (expr: string) => {
    if (!expr) return "";
    return expr
      .replace(/\*/g, "×")
      .replace(/\//g, "÷")
      .replace(/sqrt\(/g, "√( ")
      .replace(/cbrt\(/g, "³√( ")
      .replace(/logBase\(/g, "log_b( ")
      .replace(/fact\(/g, "fact( ")
      .replace(/asin\(/g, "sin⁻¹( ")
      .replace(/acos\(/g, "cos⁻¹( ")
      .replace(/atan\(/g, "tan⁻¹( ")
      .replace(/pi/g, "π")
      .replace(/asinh\(/g, "sinh⁻¹( ")
      .replace(/acosh\(/g, "cosh⁻¹( ")
      .replace(/atanh\(/g, "tanh⁻¹( ")
      .replace(/e_q/g, "e_charge")
      .replace(/R_gas/g, "R")
      .replace(/F_far/g, "F");
  };

  // Check if result is a pure real number and convert to fraction approximation if toggled
  const renderResult = () => {
    if (!result) return "";
    if (result === "Math ERROR" || result === "Syntax ERROR" || result.includes("ERROR") || result === "Error") {
      return <span className="text-red-500 font-semibold">{result}</span>;
    }

    // Try translating fraction
    const num = parseFloat(result);
    if (showFraction && !isNaN(num) && isFinite(num) && !result.includes("i")) {
      const frac = getFractionApproximation(num);
      if (frac && frac[1] > 1) {
        const [numr, denr] = frac;
        return (
          <div className="flex items-center justify-end font-mono">
            <span className="text-right text-emerald-400 text-lg md:text-xl">
              {numr}
              <span className="mx-1 text-gray-500">/</span>
              {denr}
            </span>
            <span className="text-xs text-gray-400 ml-2">(≈ {formatFloat(num)})</span>
          </div>
        );
      }
    }

    return result;
  };

  return (
    <div
      id="calculator_screen"
      className={`bg-black/55 border border-zinc-800 rounded-xl shadow-inner relative flex flex-col justify-between select-none overflow-hidden text-zinc-100 transition-all duration-300 ${
        calScale === "compact"
          ? "h-26 p-2.5"
          : calScale === "large"
          ? "h-40 p-5"
          : "h-32 md:h-36 p-4" // normal / full
      }`}
    >
      {/* Top Status Bar Indicators */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-zinc-500 border-b border-zinc-800/60 pb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded-sm text-[9px] ${
              isShift ? "bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30" : "opacity-25 text-zinc-400 font-bold bg-zinc-900/40"
            }`}
          >
            SHIFT
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-sm text-[9px] ${
              isAlpha ? "bg-rose-500/20 text-rose-500 font-bold border border-rose-500/30" : "opacity-25 text-zinc-400 font-bold bg-zinc-900/40"
            }`}
          >
            ALPHA
          </span>
          <span
            className={`px-1.5 py-0.5 rounded-sm text-[9px] ${
              isMemoryNonZero ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30" : "opacity-25 text-zinc-400 font-bold bg-zinc-900/40"
            }`}
          >
            M
          </span>
        </div>

        {/* Mode Indicators */}
        <div className="flex items-center gap-1.5">
          {calcMode === CalcMode.BASE_N ? (
            <span className="font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] border border-amber-500/20">{baseNMode}</span>
          ) : (
            <span className="font-semibold text-zinc-400 bg-zinc-800/30 px-1.5 py-0.5 rounded text-[9px] border border-zinc-800/50">{calcMode}</span>
          )}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5">
            <span className={angleMode === "DEG" ? "text-emerald-500 font-bold text-[9px] bg-emerald-500/10 px-1 rounded border border-emerald-500/20" : "opacity-30 text-[9px]"}>DEG</span>
            <span className={angleMode === "RAD" ? "text-emerald-500 font-bold text-[9px] bg-emerald-500/10 px-1 rounded border border-emerald-500/20" : "opacity-30 text-[9px]"}>RAD</span>
            <span className={angleMode === "GRAD" ? "text-emerald-500 font-bold text-[9px] bg-emerald-500/10 px-1 rounded border border-emerald-500/20" : "opacity-30 text-[9px]"}>GRAD</span>
          </div>
        </div>
      </div>

      {/* Primary Mathematical Expression Input */}
      <div className="flex-1 my-1 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent py-1 flex items-center">
        {expression ? (
          <span className={`font-mono text-zinc-400 tracking-wide transition-all ${
            calScale === "compact" ? "text-xs" : calScale === "large" ? "text-lg md:text-xl" : "text-md md:text-lg"
          }`}>
            {formatExpression(expression)}
            <span className="animate-[pulse_1s_infinite] ml-0.5 text-zinc-100">|</span>
          </span>
        ) : (
          <span className={`font-mono italic text-zinc-650 transition-all ${
            calScale === "compact" ? "text-[10px]" : "text-xs"
          }`}>Enter expression...</span>
        )}
      </div>

      {/* Result Display Line */}
      <div className={`text-right font-mono tracking-normal font-semibold text-zinc-100 min-h-[28px] flex items-center justify-end select-text transition-all ${
        calScale === "compact" ? "text-md" : calScale === "large" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
      }`}>
        {renderResult()}
      </div>
    </div>
  );
}
