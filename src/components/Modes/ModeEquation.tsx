/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { EqnType } from "../../types";
import { solveQuadratic, solveCubic, solveSimul2, solveSimul3 } from "../../utils/mathEngine";

export default function ModeEquation() {
  const [eqnType, setEqnType] = useState<EqnType>("POLY_2");

  // Local inputs state based on the maximum coefficient structure (up to 12 slots for SIMUL_3)
  const [coefficients, setCoefficients] = useState<string[]>(() => Array(12).fill(""));
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getEquationMetadata = (type: EqnType) => {
    switch (type) {
      case "SIMUL_2":
        return {
          title: "Linear System (2 Variables)",
          formula: "a1 x + b1 y = c1",
          inputs: [
            { label: "a1", id: 0 }, { label: "b1", id: 1 }, { label: "c1", id: 2 },
            { label: "a2", id: 3 }, { label: "b2", id: 4 }, { label: "c2", id: 5 }
          ],
          cols: 3,
        };
      case "SIMUL_3":
        return {
          title: "Linear System (3 Variables)",
          formula: "a1 x + b1 y + c1 z = d1",
          inputs: [
            { label: "a1", id: 0 }, { label: "b1", id: 1 }, { label: "c1", id: 2 }, { label: "d1", id: 3 },
            { label: "a2", id: 4 }, { label: "b2", id: 5 }, { label: "c2", id: 6 }, { label: "d2", id: 7 },
            { label: "a3", id: 8 }, { label: "b3", id: 9 }, { label: "c3", id: 10 }, { label: "d3", id: 11 }
          ],
          cols: 4,
        };
      case "POLY_2":
        return {
          title: "Quadratic Equation (Degree 2)",
          formula: "a x² + b x + c = 0",
          inputs: [
            { label: "a", id: 0 }, { label: "b", id: 1 }, { label: "c", id: 2 }
          ],
          cols: 3,
        };
      case "POLY_3":
        return {
          title: "Cubic Equation (Degree 3)",
          formula: "a x³ + b x² + c x + d = 0",
          inputs: [
            { label: "a", id: 0 }, { label: "b", id: 1 }, { label: "c", id: 2 }, { label: "d", id: 3 }
          ],
          cols: 4,
        };
    }
  };

  const handleTypeChange = (type: EqnType) => {
    setEqnType(type);
    setCoefficients(Array(12).fill(""));
    setResults(null);
    setError(null);
  };

  const handleCoefChange = (idx: number, val: string) => {
    const updated = [...coefficients];
    updated[idx] = val;
    setCoefficients(updated);
  };

  const solveEquation = () => {
    try {
      const meta = getEquationMetadata(eqnType);
      const parsedCoefs = meta.inputs.map((inp) => {
        const raw = coefficients[inp.id];
        const val = parseFloat(raw);
        if (isNaN(val)) return 0;
        return val;
      });

      setError(null);
      let solution: string[] = [];

      if (eqnType === "POLY_2") {
        solution = solveQuadratic(parsedCoefs[0], parsedCoefs[1], parsedCoefs[2]);
      } else if (eqnType === "POLY_3") {
        solution = solveCubic(parsedCoefs[0], parsedCoefs[1], parsedCoefs[2], parsedCoefs[3]);
      } else if (eqnType === "SIMUL_2") {
        solution = solveSimul2(parsedCoefs);
      } else if (eqnType === "SIMUL_3") {
        solution = solveSimul3(parsedCoefs);
      }

      setResults(solution);
    } catch (err: any) {
      setError(err.message || "Roots calculation failed");
      setResults(null);
    }
  };

  const clearInputs = () => {
    setCoefficients(Array(12).fill(""));
    setResults(null);
    setError(null);
  };

  const meta = getEquationMetadata(eqnType);

  return (
    <div
      id="mode_equation_panel"
      className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-4 shadow-lg animate-[fadeIn_0.25s_ease-out]"
    >
      <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
          Equation Solver MOD
        </h3>
        <p className="text-[10px] text-zinc-500">
          Solve systems of linear equations or calculate dynamic quadratic/cubic roots.
        </p>
      </div>

      {/* Select EQN Class */}
      <div className="flex flex-wrap gap-2">
        {(["SIMUL_2", "SIMUL_3", "POLY_2", "POLY_3"] as const).map((t) => {
          let label = "";
          if (t === "SIMUL_2") label = "Simul 2Var";
          if (t === "SIMUL_3") label = "Simul 3Var";
          if (t === "POLY_2") label = "Polynomial ax²";
          if (t === "POLY_3") label = "Polynomial ax³";

          return (
            <button
              key={t}
              id={`btn_eqn_type_${t.toLowerCase()}`}
              onClick={() => handleTypeChange(t)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-sans font-semibold cursor-pointer border transition-all text-center min-w-[100px] ${
                eqnType === t
                  ? "bg-zinc-900 border-zinc-450 text-zinc-100 font-extrabold"
                  : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Inputs Form */}
      <div className="bg-zinc-905 rounded-xl p-3 border border-zinc-900 flex flex-col gap-3">
        <div className="flex justify-between items-center text-[11px] font-mono border-b border-zinc-900 pb-1.5">
          <span className="text-zinc-400 font-semibold">{meta.title}</span>
          <span className="text-zinc-300 font-extrabold italic">{meta.formula}</span>
        </div>

        {/* Dynamic Coefficients Spreadsheet Grid */}
        <div
          className="grid gap-3 justify-center text-center py-1.5"
          style={{ gridTemplateColumns: `repeat(${meta.cols}, minmax(0, 1fr))` }}
        >
          {meta.inputs.map((inp) => (
            <div key={inp.label} className="flex flex-col gap-1 items-center">
              <label className="text-[10px] font-mono text-zinc-500 font-bold">{inp.label}</label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={coefficients[inp.id]}
                id={`input_coef_${inp.label}`}
                onChange={(e) => handleCoefChange(inp.id, e.target.value)}
                className="w-full text-center font-mono py-1 rounded bg-zinc-950 border border-zinc-855 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-800 text-xs text-semibold shadow-inner"
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            id="btn_solve_equation"
            onClick={solveEquation}
            className="flex-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-extrabold font-sans rounded-lg text-xs cursor-pointer shadow-md transition-all"
          >
            Solve Equation
          </button>
          <button
            id="btn_clear_equation"
            onClick={clearInputs}
            className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans rounded-lg text-xs cursor-pointer"
          >
            Clear Coefficients
          </button>
        </div>
      </div>

      {/* Solving Result Panel */}
      {(results || error) && (
        <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-900 flex flex-col gap-2.5 animate-[fadeIn_0.2s_ease-out] shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Roots Calculated:
          </span>

          {error ? (
            <span className="text-xs font-mono text-rose-450 font-medium">{error}</span>
          ) : results ? (
            <div className="flex flex-col gap-1.5 font-mono text-xs text-zinc-200">
              {results.map((sol, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-zinc-900/60 p-1.5 rounded border border-zinc-900 pl-3 font-semibold text-emerald-400"
                >
                  <span>{sol}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
