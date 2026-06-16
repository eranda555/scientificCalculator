/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Sparkles,
  Cpu,
  Clock,
  HelpCircle,
  Database,
  History,
  Activity,
  Calculator,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { CalcMode, AngleMode, BaseNMode, CalcVariables, HistoryItem, MatrixStorage, Complex } from "./types";
import { evaluateExpression, evaluateBaseNExpression, SCIENTIFIC_CONSTANTS } from "./utils/mathEngine";
import CalculatorScreen from "./components/CalculatorScreen";

// Modes subpanels
import ModeBaseN from "./components/Modes/ModeBaseN";
import ModeMatrix from "./components/Modes/ModeMatrix";
import ModeEquation from "./components/Modes/ModeEquation";
import ModeStat from "./components/Modes/ModeStat";
import ModeConvert from "./components/Modes/ModeConvert";

export default function App() {
  // Global states
  const [calcMode, setCalcMode] = useState<CalcMode>(CalcMode.COMP);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [baseNMode, setBaseNMode] = useState<BaseNMode>("DEC");

  // Input states
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [ansVal, setAnsVal] = useState("0"); // holds the LAST computed numeric answer
  
  // Shift & Alpha active flags
  const [isShift, setIsShift] = useState(false);
  const [isAlpha, setIsAlpha] = useState(false);
  const [showFraction, setShowFraction] = useState(false);

  // Variable Memory state
  const [variables, setVariables] = useState<CalcVariables>(() => ({
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0
  }));

  // Matrix Storage (Matrix mode)
  const [matrices, setMatrices] = useState<MatrixStorage>({
    A: null, B: null, C: null
  });

  // History states
  const [history, setHistory] = useState<HistoryItem[]>(() => [
    {
      id: "h1",
      expression: "cos(pi) * 5 + ln(e^2)",
      result: "-3",
      mode: CalcMode.COMP,
      timestamp: "10:15:30"
    },
    {
      id: "h2",
      expression: "sqrt(3^2 + 4^2)",
      result: "5",
      mode: CalcMode.COMP,
      timestamp: "10:14:15"
    }
  ]);

  // UI States
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [editingVar, setEditingVar] = useState<keyof CalcVariables | null>(null);
  const [editingVarVal, setEditingVarVal] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  
  // Dynamic scale state
  const [calScale, setCalScale] = useState<"compact" | "normal" | "large" | "full">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 480) {
      return "compact";
    }
    return "normal";
  });

  // Helper functions for dynamic scale classes
  const getsKeyH = () => {
    if (calScale === "compact") return "h-7 text-[10px]";
    if (calScale === "large") return "h-9.5 text-sm";
    return "h-8 text-xs";
  };

  const getnKeyH = () => {
    if (calScale === "compact") return "h-8.5 text-xs pb-0.5";
    if (calScale === "large") return "h-12.5 text-lg pb-1";
    return "h-10 text-md pb-0.5";
  };

  // Live clock updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Physical keyboard support
  useEffect(() => {
    const handlePhysicalKeys = (e: KeyboardEvent) => {
      // Ignore when typing in administrative input fields
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      
      const key = e.key;
      if (/[0-9]/.test(key)) {
        appendToken(key);
      } else if (key === ".") {
        appendToken(".");
      } else if (key === "+") {
        appendToken("+");
      } else if (key === "-") {
        appendToken("-");
      } else if (key === "*") {
        appendToken("*");
      } else if (key === "/") {
        appendToken("/");
      } else if (key === "^") {
        appendToken("^");
      } else if (key === "(") {
        appendToken("(");
      } else if (key === ")") {
        appendToken(")");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        runEvaluation();
      } else if (key === "Backspace") {
        deleteLastSymbol();
      } else if (key === "Escape") {
        clearScreen();
      }
    };

    window.addEventListener("keydown", handlePhysicalKeys);
    return () => window.removeEventListener("keydown", handlePhysicalKeys);
  }, [expression, calcMode, angleMode, baseNMode, variables]);

  // Expression append helper
  const appendToken = (token: string) => {
    // Reset flags upon action
    setIsShift(false);
    setIsAlpha(false);

    // Filter Hex chars in non-hex systems
    if (["A", "B", "C", "D", "E", "F"].includes(token) && calcMode === CalcMode.BASE_N && baseNMode !== "HEX") {
      return;
    }

    setExpression((prev) => prev + token);
  };

  const deleteLastSymbol = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const clearScreen = () => {
    setExpression("");
    setResult("");
    setShowFraction(false);
  };

  // Run scientific calculations
  const runEvaluation = () => {
    if (!expression.trim()) return;

    let res = "";
    if (calcMode === CalcMode.BASE_N) {
      res = evaluateBaseNExpression(expression, baseNMode);
    } else {
      res = evaluateExpression(expression, angleMode, calcMode, variables);
    }

    setResult(res);

    // Save to Ans (previous answer) value if there's a successful numeric output
    if (res && !res.includes("ERROR") && !res.includes("Error") && res !== "Infinity") {
      setAnsVal(res);
      
      // Update variables Ans mapping
      setVariables(prev => ({ ...prev, Ans: parseFloat(res) || 0 } as any));

      // Append calculation to rolling History tape
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setHistory((prev) => [
        {
          id: Math.random().toString(),
          expression,
          result: res,
          mode: calcMode,
          timestamp: timeStr,
        },
        ...prev,
      ]);
    }
  };

  const handleModeChange = (mode: CalcMode) => {
    setCalcMode(mode);
    setShowModeSelector(false);
    clearScreen();
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setExpression(item.expression);
    setResult(item.result);
    setCalcMode(item.mode);
  };

  // Variables Management
  const storeToVariableWithVal = (name: keyof CalcVariables, val: number) => {
    setVariables((prev) => ({
      ...prev,
      [name]: val,
    }));
    setEditingVar(null);
  };

  const handleEditVarClick = (name: keyof CalcVariables) => {
    setEditingVar(name);
    const existing = variables[name];
    setEditingVarVal(typeof existing === "number" ? existing.toString() : existing.re.toString());
  };

  const handleSaveVarValue = () => {
    if (editingVar) {
      const parsed = parseFloat(editingVarVal);
      if (!isNaN(parsed)) {
        storeToVariableWithVal(editingVar, parsed);
      }
    }
  };

  const handleFlushVariables = () => {
    setVariables({
      A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0
    });
  };

  // Matrix updater
  const handleUpdateMatrix = (name: "A" | "B" | "C", mat: number[][] | null) => {
    setMatrices((prev) => ({
      ...prev,
      [name]: mat,
    }));
  };

  const isMemoryActive = () => {
    const memory = variables.M;
    if (typeof memory === "number") return memory !== 0;
    return memory.re !== 0 || memory.im !== 0;
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-350 flex flex-col font-sans relative antialiased selection:bg-zinc-200 selection:text-zinc-900 pb-8 md:pb-0">
      
      {/* 🚀 Top Navigation Dashboard Header */}
      <header className="h-16 border-b border-zinc-800 bg-[#0d0d10] px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-zinc-200 rounded flex items-center justify-center shadow-md">
            <span className="text-[#08080a] font-bold text-sm">Σ</span>
          </div>
          <div>
            <h1 className="font-serif italic text-lg tracking-wide text-zinc-100">
              Quantum Core SC-100
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold -mt-0.5">
              High-Precision Calculator
            </p>
          </div>
        </div>

        {/* Dynamic status widgets */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 text-[9px] uppercase tracking-[0.1em] font-semibold text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span>SYSTEM: OPTIMAL</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-semibold text-zinc-300 select-none">{currentTime || "10:18:50"}</span>
          </div>
        </div>
      </header>

      {/* Main Grid Viewport Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================
            LEFT HALF: THE PHYSICAL-STYLE CALCULATOR CHASSIS
            ============================================================ */}
        <div id="calculator_chassis_wrap" className="lg:col-span-5 flex flex-col items-center gap-2.5 w-full">
          {/* Dynamic Interactive Size Adaptation Bar */}
          <div className="w-full max-w-[420px] flex justify-between items-center bg-[#0d0d10] px-3 py-1.5 rounded-lg border border-zinc-900 shadow">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5 select-none pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[ping_1.5s_infinite]"></span>
              Display Size
            </span>
            <div className="flex bg-zinc-950 p-0.5 rounded-md border border-zinc-900">
              {(["compact", "normal", "large", "full"] as const).map((mode) => (
                <button
                  key={mode}
                  id={`btn_scale_${mode}`}
                  onClick={() => setCalScale(mode)}
                  className={`text-[9px] font-sans font-bold px-1.5 py-0.5 sm:px-2 rounded uppercase transition-colors cursor-pointer ${
                    calScale === mode
                      ? "bg-zinc-100 text-zinc-950 shadow"
                      : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div
            id="calculator_chassis"
            className={`w-full bg-[#121216] rounded-2xl border border-zinc-800 shadow-2xl relative flex flex-col transition-all duration-300 ${
              calScale === "compact"
                ? "max-w-[340px] p-3 sm:p-4 gap-2.5"
                : calScale === "large"
                ? "max-w-[490px] p-7 md:p-8 gap-5"
                : calScale === "full"
                ? "max-w-full p-4 sm:p-5 md:p-6 gap-3.5"
                : "max-w-[420px] p-5 sm:p-6 gap-3.5 md:gap-4" // normal
            }`}
          >
            {/* Casio Branding Header */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 font-sans">
                Quantum Sci
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] bg-zinc-800/80 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase border border-zinc-700/50">
                  CORE SC-100
                </span>
                <span className="text-[8px] text-zinc-650 font-mono italic">
                  64-bit
                </span>
              </div>
            </div>

            {/* Smart Solar Power Panel mock */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8">
                <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase font-mono pl-1 leading-none">
                  NATURAL V.P.A.M.
                </div>
              </div>
              <div className="col-span-4 bg-[#14100c] border border-zinc-800/80 h-4 rounded-sm flex items-center justify-around px-1 overflow-hidden opacity-80">
                <div className="w-1.5 h-full bg-amber-950/20 border-r border-[#261d15]"></div>
                <div className="w-1.5 h-full bg-amber-950/20 border-r border-[#261d15]"></div>
                <div className="w-1.5 h-full bg-amber-950/20 border-r border-[#261d15]"></div>
                <div className="w-1.5 h-full bg-amber-950/20"></div>
              </div>
            </div>

            {/* HIGH FIDELITY LCD DOT-MATRIX DISPLAY SCREEN */}
            <CalculatorScreen
              expression={expression}
              result={result}
              calcMode={calcMode}
              angleMode={angleMode}
              baseNMode={baseNMode}
              isShift={isShift}
              isAlpha={isAlpha}
              isMemoryNonZero={isMemoryActive()}
              showFraction={showFraction}
              calScale={calScale}
            />

            {/* GRAPHICAL CLASSWIZ MODE MENU OVERLAY */}
            {showModeSelector && (
              <div
                id="mode_selector_overlay"
                className="absolute inset-x-5 top-[92px] bg-slate-950/95 border-2 border-amber-500/40 rounded-xl p-4 shadow-2xl z-40 animate-[fadeIn_0.15s_ease-out] flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                  <span className="text-xs font-bold text-slate-300 font-sans tracking-wide">
                    Select Calculation Mode:
                  </span>
                  <button
                    id="btn_close_mode_selector"
                    onClick={() => setShowModeSelector(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer font-bold font-mono"
                  >
                    CLOSE [×]
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { mode: CalcMode.COMP, label: "1: COMP (Math)", desc: "General science & algebra" },
                    { mode: CalcMode.CMPLX, label: "2: CMPLX (Complex)", desc: "Real & imaginary numbers" },
                    { mode: CalcMode.BASE_N, label: "3: BASE-N (Binary)", desc: "Dec, Hex, Bin, Oct math" },
                    { mode: CalcMode.MATRIX, label: "4: MATRIX (Algebra)", desc: "Determinants, inversions" },
                    { mode: CalcMode.EQN, label: "5: EQN (Solvers)", desc: "Polynomials & systems" },
                    { mode: CalcMode.STAT, label: "6: STAT (Statistics)", desc: "Mean, variances, records" },
                    { mode: CalcMode.CONV, label: "7: CONV (Conversions)", desc: "Physical scale transformer" },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      id={`btn_mode_select_${item.mode.toLowerCase()}`}
                      onClick={() => handleModeChange(item.mode)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col gap-0.5 ${
                        calcMode === item.mode
                          ? "bg-amber-500/10 border-amber-500/45 text-amber-400"
                          : "bg-slate-900 border-slate-850 hover:bg-slate-850 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">{item.label}</span>
                      <span className="text-[9px] text-slate-500 hidden sm:block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CHASSIS PHYSICAL INTERACTIVE KEYBOARD */}
            <div
              id="calculator_keyboard"
              className={`flex flex-col transition-all duration-300 ${calScale === "compact" ? "gap-1.5" : calScale === "large" ? "gap-4" : "gap-3"}`}
              style={{
                "--sci-key-h": calScale === "compact" ? "26px" : calScale === "large" ? "38px" : "32px",
                "--sci-key-fs": calScale === "compact" ? "10px" : calScale === "large" ? "13px" : "11px",
                "--std-key-h": calScale === "compact" ? "32px" : calScale === "large" ? "48px" : "40px",
                "--std-key-fs": calScale === "compact" ? "12px" : calScale === "large" ? "18px" : "15px",
                "--dpad-sz": calScale === "compact" ? "54px" : calScale === "large" ? "84px" : "72px",
                "--ctrl-key-w": calScale === "compact" ? "38px" : calScale === "large" ? "56px" : "46px",
                "--ctrl-key-h": calScale === "compact" ? "22px" : calScale === "large" ? "32px" : "26px",
                "--ctrl-key-fs": calScale === "compact" ? "8px" : calScale === "large" ? "11px" : "9px",
              } as React.CSSProperties}
            >
              
              {/* --- SECONDARY CONTROLS ROW (SHIFT, ALPHA, ARROWS, MODE, ON) --- */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                <div className="col-span-2.5 flex flex-col items-center">
                  <span className="text-[8px] font-mono font-bold text-amber-500 leading-tight mb-1 select-none">
                    SHIFT
                  </span>
                  <button
                    id="btn_shift"
                    onClick={() => {
                      setIsShift(!isShift);
                      setIsAlpha(false);
                    }}
                    className={`w-11 h-6.5 rounded-md cursor-pointer border shadow transition-all active:scale-95 ${
                      isShift
                        ? "bg-amber-500 border-amber-400 text-zinc-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-zinc-800/50 border-zinc-700/40 text-amber-500 hover:bg-zinc-700 hover:text-amber-400"
                    }`}
                  ></button>
                </div>

                <div className="col-span-2.5 flex flex-col items-center">
                  <span className="text-[8px] font-mono font-bold text-rose-500 leading-tight mb-1 select-none">
                    ALPHA
                  </span>
                  <button
                    id="btn_alpha"
                    onClick={() => {
                      setIsAlpha(!isAlpha);
                      setIsShift(false);
                    }}
                    className={`w-11 h-6.5 rounded-md cursor-pointer border shadow transition-all active:scale-95 ${
                      isAlpha
                        ? "bg-rose-500 border-rose-450 text-white font-black shadow-md shadow-rose-500/25"
                        : "bg-zinc-800/50 border-zinc-700/40 text-rose-500 hover:bg-zinc-700 hover:text-rose-400"
                    }`}
                  ></button>
                </div>

                {/* Circular D-PAD Controller Joystick */}
                <div className="col-span-4 flex justify-center">
                  <div className="w-18 h-18 bg-zinc-950 border border-zinc-800 rounded-full relative flex items-center justify-center p-1 shadow-inner select-none">
                    <button
                      id="btn_dpad_up"
                      onClick={() => {
                        // Scrolling history upward
                        if (history.length > 0) {
                          loadHistoryItem(history[0]);
                        }
                      }}
                      className="absolute top-1 text-[8px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
                    >
                      ▲
                    </button>
                    <button
                      id="btn_dpad_down"
                      onClick={() => {
                        if (history.length > 1) {
                          loadHistoryItem(history[1]);
                        }
                      }}
                      className="absolute bottom-1 text-[8px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
                    >
                      ▼
                    </button>
                    <button
                      id="btn_dpad_left"
                      className="absolute left-1 text-[8px] font-mono text-zinc-500 hover:text-zinc-300 cursor-any p-1"
                    >
                      ◀
                    </button>
                    <button
                      id="btn_dpad_right"
                      className="absolute right-1 text-[8px] font-mono text-zinc-500 hover:text-zinc-300 cursor-any p-1"
                    >
                      ▶
                    </button>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shadow"></div>
                  </div>
                </div>

                <div className="col-span-3 flex flex-col items-center">
                  <span className="text-[8px] font-mono text-zinc-400 font-bold leading-tight mb-1 select-none">
                    MODE
                  </span>
                  <button
                    id="btn_mode"
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    className="w-12 h-6.5 bg-zinc-800/40 text-zinc-300 text-[9px] font-bold tracking-normal rounded-md cursor-pointer border border-zinc-800 hover:bg-zinc-850 hover:text-zinc-100 active:scale-95"
                  >
                    SETUP
                  </button>
                </div>
              </div>

              {/* Angle mode switcher helper button */}
              <div className="flex justify-end pr-1 mt-0.5">
                <button
                  id="btn_toggle_angle"
                  onClick={() => {
                    const nextMode = angleMode === "DEG" ? "RAD" : angleMode === "RAD" ? "GRAD" : "DEG";
                    setAngleMode(nextMode);
                  }}
                  className="text-[8px] font-mono text-zinc-450 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 px-2.5 py-0.5 rounded cursor-pointer transition-all"
                >
                  [Angle: {angleMode}]
                </button>
              </div>

              {/* --- SCIENTIFIC LAYOUT ROWS --- */}
              <div className="grid grid-cols-6 gap-2">
                
                {/* SQRT / CBRT */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">³√</span>
                  <button
                    id="key_sqrt"
                    onClick={() => appendToken(isShift ? "cbrt(" : "sqrt(")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    √
                  </button>
                </div>

                {/* x² / x³ */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">x³</span>
                  <button
                    id="key_square"
                    onClick={() => appendToken(isShift ? "^3" : "^2")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    x²
                  </button>
                </div>

                {/* x^y */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">x√</span>
                  <button
                    id="key_power"
                    onClick={() => appendToken("^")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    ^
                  </button>
                </div>

                {/* log / custom log base_b */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">log_b</span>
                  <button
                    id="key_log"
                    onClick={() => appendToken(isShift ? "logBase(" : "log(")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    log
                  </button>
                </div>

                {/* ln / custom e^x */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">e^x</span>
                  <button
                    id="key_ln"
                    onClick={() => appendToken(isShift ? "e^(" : "ln(")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    ln
                  </button>
                </div>

                {/* Fraction key */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">x⁻¹</span>
                  <button
                    id="key_fraction"
                    onClick={() => appendToken(isShift ? "^-1" : "/")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-[10px] cursor-pointer active:scale-95 shadow-md"
                  >
                    1/x
                  </button>
                </div>

                {/* Negation (-) / Absolute ABS */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">ABS</span>
                  <button
                    id="key_neg"
                    onClick={() => appendToken(isShift ? "abs(" : "-")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    (-)
                  </button>
                </div>

                {/* COMMA / HYPERBOLICS */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">hyp</span>
                  <button
                    id="key_comma"
                    onClick={() => appendToken(isShift ? "asinh(" : ",")}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    {isShift ? "hyp" : ","}
                  </button>
                </div>

                {/* SIN / ASIN */}
                <div className="flex flex-col items-center text-[9px] font-semibold relative">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">sin⁻¹</span>
                  <span className="text-rose-500/80 text-[7px] font-mono select-none absolute mt-0.5 right-1">D</span>
                  <button
                    id="key_sin"
                    onClick={() => {
                      if (isAlpha) appendToken("D");
                      else appendToken(isShift ? "asin(" : "sin(");
                    }}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    sin
                  </button>
                </div>

                {/* COS / ACOS */}
                <div className="flex flex-col items-center text-[9px] font-semibold relative">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">cos⁻¹</span>
                  <span className="text-rose-500/80 text-[7px] font-mono select-none absolute mt-0.5 right-1">E</span>
                  <button
                    id="key_cos"
                    onClick={() => {
                      if (isAlpha) appendToken("E");
                      else appendToken(isShift ? "acos(" : "cos(");
                    }}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    cos
                  </button>
                </div>

                {/* TAN / ATAN */}
                <div className="flex flex-col items-center text-[9px] font-semibold relative">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">tan⁻¹</span>
                  <span className="text-rose-500/80 text-[7px] font-mono select-none absolute mt-0.5 right-1">F</span>
                  <button
                    id="key_tan"
                    onClick={() => {
                      if (isAlpha) appendToken("F");
                      else appendToken(isShift ? "atan(" : "tan(");
                    }}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    tan
                  </button>
                </div>

                {/* STO / VARIABLE RECALL */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/85 text-[8px] font-mono select-none">STO</span>
                  <button
                    id="key_sto"
                    onClick={() => appendToken("M")}
                    className="w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    rcl
                  </button>
                </div>

                {/* parenthesis ( */}
                <div className="flex flex-col items-center text-[9px] font-semibold relative">
                  <span className="text-rose-500/80 text-[8px] font-mono select-none">X</span>
                  <button
                    id="key_paren_left"
                    onClick={() => {
                      if (isAlpha) appendToken("X");
                      else appendToken("(");
                    }}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    (
                  </button>
                </div>

                {/* parenthesis ) */}
                <div className="flex flex-col items-center text-[9px] font-semibold relative">
                  <span className="text-rose-500/80 text-[8px] font-mono select-none">Y</span>
                  <button
                    id="key_paren_right"
                    onClick={() => {
                      if (isAlpha) appendToken("Y");
                      else appendToken(")");
                    }}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    )
                  </button>
                </div>

                {/* S-D Toggle key */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">M-</span>
                  <button
                    id="key_s_d"
                    onClick={() => setShowFraction(!showFraction)}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-[10px] cursor-pointer active:scale-95 shadow-md"
                  >
                    S↔D
                  </button>
                </div>

                {/* M+ Memory Add */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">M+</span>
                  <button
                    id="key_m_plus"
                    onClick={() => {
                      // memory addition
                      if (result && !isNaN(parseFloat(result))) {
                        const parsed = parseFloat(result);
                        const currM = typeof variables.M === "number" ? variables.M : variables.M.re;
                        storeToVariableWithVal("M", currM + parsed);
                      }
                    }}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-amber-500 rounded font-mono font-bold text-[10px] cursor-pointer active:scale-95 shadow-md"
                  >
                    M+
                  </button>
                </div>

                {/* Complex imaginary i symbol */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">i</span>
                  <button
                    id="key_imag_i"
                    onClick={() => appendToken("i")}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    ENG
                  </button>
                </div>

                {/* Statistics / Base bits modifiers */}
                <div className="flex flex-col items-center text-[9px] font-semibold">
                  <span className="text-amber-500/80 text-[8px] font-mono select-none">fact</span>
                  <button
                    id="key_fact"
                    onClick={() => appendToken("fact(")}
                    className="col-span-1 w-full text-center h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded font-mono font-bold text-xs cursor-pointer active:scale-95 shadow-md"
                  >
                    x!
                  </button>
                </div>

              </div>

              {/* --- STANDARD KEYPAD ROWS (7-9, DEL, AC, + - * /) --- */}
              <div className="grid grid-cols-5 gap-2.5 mt-2">
                
                {/* Row 1 */}
                <button
                  id="key_7"
                  onClick={() => {
                    if (isAlpha) appendToken("A");
                    else appendToken("7");
                  }}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  {isAlpha ? "A" : "7"}
                </button>
                <button
                  id="key_8"
                  onClick={() => {
                    if (isAlpha) appendToken("B");
                    else appendToken("8");
                  }}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  {isAlpha ? "B" : "8"}
                </button>
                <button
                  id="key_9"
                  onClick={() => {
                    if (isAlpha) appendToken("C");
                    else appendToken("9");
                  }}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  {isAlpha ? "C" : "9"}
                </button>
                <button
                  id="key_del"
                  onClick={deleteLastSymbol}
                  className="h-10 text-xs font-bold leading-relaxed bg-zinc-800 hover:bg-zinc-750 text-rose-400 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-700/60 shadow"
                >
                  DEL
                </button>
                <button
                  id="key_ac"
                  onClick={clearScreen}
                  className="h-10 text-xs font-bold leading-relaxed bg-zinc-800 hover:bg-zinc-750 text-rose-400 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-700/60 shadow"
                >
                  AC
                </button>

                {/* Row 2 */}
                <button
                  id="key_4"
                  onClick={() => appendToken("4")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  4
                </button>
                <button
                  id="key_5"
                  onClick={() => appendToken("5")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  5
                </button>
                <button
                  id="key_6"
                  onClick={() => appendToken("6")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  6
                </button>
                <button
                  id="key_multiply"
                  onClick={() => {
                    if (calcMode === CalcMode.BASE_N) appendToken("AND");
                    else appendToken("*");
                  }}
                  className="h-10 text-md font-bold bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  {calcMode === CalcMode.BASE_N ? "AND" : "×"}
                </button>
                <button
                  id="key_divide"
                  onClick={() => {
                    if (calcMode === CalcMode.BASE_N) appendToken("OR");
                    else appendToken("/");
                  }}
                  className="h-10 text-md font-bold bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  {calcMode === CalcMode.BASE_N ? "OR" : "÷"}
                </button>

                {/* Row 3 */}
                <button
                  id="key_1"
                  onClick={() => appendToken("1")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  1
                </button>
                <button
                  id="key_2"
                  onClick={() => appendToken("2")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  2
                </button>
                <button
                  id="key_3"
                  onClick={() => appendToken("3")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  3
                </button>
                <button
                  id="key_add"
                  onClick={() => {
                    if (calcMode === CalcMode.BASE_N) appendToken("XOR");
                    else appendToken("+");
                  }}
                  className="h-10 text-md font-bold bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  {calcMode === CalcMode.BASE_N ? "XOR" : "+"}
                </button>
                <button
                  id="key_sub"
                  onClick={() => {
                    if (calcMode === CalcMode.BASE_N) appendToken("NOT");
                    else appendToken("-");
                  }}
                  className="h-10 text-md font-bold bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  {calcMode === CalcMode.BASE_N ? "NOT" : "−"}
                </button>

                {/* Row 4 */}
                <button
                  id="key_0"
                  onClick={() => appendToken("0")}
                  className="h-10 text-md font-sans bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  0
                </button>
                <button
                  id="key_decimal"
                  onClick={() => appendToken(".")}
                  className="h-10 text-lg font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg cursor-pointer transition-all active:scale-95 border-b-2 border-zinc-300 shadow"
                >
                  .
                </button>
                <button
                  id="key_multiplier_ten"
                  onClick={() => appendToken("*10^(")}
                  className="h-10 text-xs font-bold leading-normal bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  ×10^x
                </button>
                <button
                  id="key_ans"
                  onClick={() => {
                    if (calcMode === CalcMode.BASE_N) appendToken("XNOR");
                    else appendToken(ansVal);
                  }}
                  className="h-10 text-xs font-bold bg-zinc-800/30 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer transition-all active:scale-95 border border-zinc-800/60 shadow"
                >
                  {calcMode === CalcMode.BASE_N ? "XNOR" : "ANS"}
                </button>
                <button
                  id="key_equal"
                  onClick={runEvaluation}
                  className="h-10 text-2xl font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-900 rounded-lg cursor-pointer transition-all active:scale-92 border-b-2 border-zinc-400 shadow-md"
                >
                  =
                </button>

              </div>

            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT HALF: THE MODERN CO-PILOT LEDGER HUD PANEL
            ============================================================ */}
        <div className="lg:col-span-7 flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Dynamic Active Mode Panel workspace */}
          <div className="animate-[fadeIn_0.25s_ease-out]">
            {calcMode === CalcMode.BASE_N && (
              <ModeBaseN
                currentValueStr={result || ansVal}
                baseMode={baseNMode}
                onSelectBase={setBaseNMode}
              />
            )}
            {calcMode === CalcMode.MATRIX && (
              <ModeMatrix matrices={matrices} onUpdateMatrix={handleUpdateMatrix} />
            )}
            {calcMode === CalcMode.EQN && <ModeEquation />}
            {calcMode === CalcMode.STAT && <ModeStat />}
            {calcMode === CalcMode.CONV && <ModeConvert />}

            {/* Standard mathematical helpers explanation when in main computing mode */}
            {(calcMode === CalcMode.COMP || calcMode === CalcMode.CMPLX) && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-2 shadow-lg">
                <span className="text-xs font-mono tracking-wider font-bold text-zinc-400 uppercase">
                  {calcMode} MODE GUIDE
                </span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  You are evaluating algebraic formulas directly. Use <strong>implicit multiplication</strong> (e.g. <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">2pi</code> becoming <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">2 * pi</code> or <code className="text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded font-mono">sin(pi)cos(pi)</code>) and nest parentheses perfectly.
                </p>
                {calcMode === CalcMode.CMPLX && (
                  <p className="text-[11px] text-amber-500/80 leading-relaxed font-semibold border-t border-zinc-900 pt-1.5 mt-1">
                    * CMPLX Support: imaginary constant <code className="text-amber-450 font-bold bg-zinc-900/40 px-1 py-0.5 rounded font-mono">i</code> outputs complex equations such as <code className="text-amber-450 font-bold">(2 + 3i) * (1 - i)</code> yielding complex vectors.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* TWO MAIN HORIZONTAL CARDS: Variables Inspector vs Scientific Constants Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. VARIABLE MEMORIES INSPECTOR */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 flex flex-col gap-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans">
                    Symbol Memories
                  </h3>
                </div>
                <button
                  id="btn_clear_variables"
                  onClick={handleFlushVariables}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer transition-colors"
                >
                  FLUSH ALL
                </button>
              </div>

              {/* Grid of values */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(variables) as Array<keyof CalcVariables>).map((key) => {
                  const val = variables[key];
                  const formattedVal =
                    typeof val === "number"
                      ? val.toString()
                      : `${val.re} ${val.im >= 0 ? "+" : "-"} ${Math.abs(val.im)}i`;

                  return (
                    <button
                      key={key}
                      id={`btn_var_inspect_${key}`}
                      onClick={() => handleEditVarClick(key)}
                      className="bg-zinc-900/40 hover:bg-zinc-900 py-1.5 px-2.5 rounded border border-zinc-900 hover:border-zinc-800 text-left cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-bold text-amber-500 mb-0.5 font-mono">{key}</span>
                      <span className="text-[10px] font-mono text-zinc-300 font-semibold truncate max-w-full">
                        {formattedVal}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Inline variable custom editor panel */}
              {editingVar && (
                <div className="bg-zinc-900/60 p-3 rounded border border-amber-500/30 flex flex-col gap-2 mt-1 animate-[fadeIn_0.15s_ease-out]">
                  <span className="text-[10px] font-mono font-bold text-amber-500">
                    Assign numeric value to variable [{editingVar}]:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      value={editingVarVal}
                      onChange={(e) => setEditingVarVal(e.target.value)}
                      id="input_var_assign_val"
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-xs px-2 py-1 text-zinc-100 placeholder-zinc-800 focus:outline-none"
                    />
                    <button
                      id="btn_save_var_val"
                      onClick={handleSaveVarValue}
                      className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold font-sans text-xs px-3 py-1 rounded cursor-pointer transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CONSTANTS CATALOG CARD */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 flex flex-col gap-3 shadow-xl">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans">
                    Physical Constants
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Click to insert</span>
              </div>

              {/* Scroll list of physical constants */}
              <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {SCIENTIFIC_CONSTANTS.map((c) => (
                  <button
                    key={c.symbol}
                    id={`btn_insert_constant_${c.symbol}`}
                    onClick={() => appendToken(c.symbol)}
                    className="p-1.5 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-800 border border-zinc-900 rounded text-left flex flex-col gap-0.5 justify-between transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold font-mono text-cyan-400">{c.symbol}</span>
                       <span className="text-[8px] text-zinc-500 font-mono truncate">{c.unit}</span>
                    </div>
                    <span className="text-[9px] text-zinc-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 3. ROLLING CALCULATION LEDGER JOURNAL HISTORY */}
          <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-900 flex flex-col gap-3 flex-1 flex-grow shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans">
                  Dynamic Tape History
                </h3>
              </div>
              {history.length > 0 && (
                <button
                  id="btn_clear_history"
                  onClick={clearHistory}
                  className="text-[10px] text-rose-500 hover:text-rose-400 font-mono cursor-pointer transition-colors"
                >
                  CLEAR TAPE
                </button>
              )}
            </div>

            {/* Scroll tape logs list */}
            <div className="flex-1 overflow-y-auto max-h-64 pr-1.5 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {history.length === 0 ? (
                <div className="text-[11px] text-zinc-650 font-mono italic text-center py-12">
                  Tape ledger is empty. Perform calculations on the keypad to record.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/30 hover:bg-zinc-900/70 p-3 rounded-lg border border-zinc-900 hover:border-zinc-800 flex flex-col gap-2.5 transition-all group"
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-zinc-400 border border-zinc-900">
                        {item.mode} Mode
                      </span>
                      <span className="text-[9px] text-zinc-650 font-semibold">{item.timestamp}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {/* Clickable formula line */}
                      <button
                        onClick={() => {
                          setExpression(item.expression);
                          setResult("");
                          setCalcMode(item.mode);
                        }}
                        className="w-full text-left font-mono text-xs text-zinc-350 hover:text-amber-400 font-semibold truncate pl-0.5 transition-all cursor-pointer group/item flex items-center justify-between"
                        title="Click to copy this expression to input screen (reuse formulas)"
                      >
                        <span className="truncate">{item.expression}</span>
                        <span className="opacity-0 group-hover/item:opacity-100 text-[8px] text-amber-500 font-sans tracking-wide ml-2 bg-amber-500/10 px-1 rounded transition-opacity">
                          REUSE FORMULA ⏎
                        </span>
                      </button>

                      {/* Clickable answer line */}
                      <button
                        onClick={() => {
                          appendToken(item.result);
                        }}
                        className="w-full text-right font-mono text-sm text-emerald-400 hover:text-emerald-300 font-bold pr-1 transition-all cursor-pointer group/ans flex items-center justify-between pl-4"
                        title="Click to append this answer into active computation buffer"
                      >
                        <span className="opacity-0 group-hover/ans:opacity-100 text-[8px] text-emerald-400 font-sans tracking-wide bg-emerald-500/10 px-1 rounded transition-opacity normal-case font-normal">
                          APPEND RESULT ⏎
                        </span>
                        <span>= {item.result}</span>
                      </button>
                    </div>

                    {/* Quick Helper Action Pills */}
                    <div className="flex justify-between items-center border-t border-zinc-900/60 pt-2 text-[9px] mt-0.5">
                      <span className="text-[8px] text-zinc-600 uppercase tracking-wider font-mono font-bold select-none">
                        Interactive Tap
                      </span>
                      <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setExpression(item.expression);
                            setResult("");
                            setCalcMode(item.mode);
                          }}
                          className="text-[9px] font-sans font-medium bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
                          title="Load this formula to screen"
                        >
                          Load Expr
                        </button>
                        <button
                          onClick={() => {
                            appendToken(item.result);
                          }}
                          className="text-[9px] font-sans font-medium bg-zinc-950 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded border border-zinc-900 hover:border-emerald-900/50 transition-all cursor-pointer"
                          title="Append this result to current expression"
                        >
                          Recall Ans
                        </button>
                        <button
                          onClick={() => loadHistoryItem(item)}
                          className="text-[9px] font-sans font-semibold bg-zinc-950 hover:bg-zinc-800 text-amber-500 hover:text-amber-400 px-1.5 py-0.5 rounded border border-zinc-900 transition-all cursor-pointer"
                          title="Restore full system state"
                        >
                          Restore State
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-900 pt-2 text-[10px] text-zinc-600 font-mono flex justify-between items-center">
              <span>* Tape history stores calculations on local component stack states.</span>
              <span>Total rows: {history.length}</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
