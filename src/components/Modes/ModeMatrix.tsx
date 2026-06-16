/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Matrix, MatrixStorage } from "../../types";
import {
  matrixAdd,
  matrixSub,
  matrixMul,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  formatFloat
} from "../../utils/mathEngine";

interface ModeMatrixProps {
  matrices: MatrixStorage;
  onUpdateMatrix: (name: "A" | "B" | "C", matrix: Matrix | null) => void;
}

export default function ModeMatrix({ matrices, onUpdateMatrix }: ModeMatrixProps) {
  const [editingTarget, setEditingTarget] = useState<"A" | "B" | "C">("A");
  const [size, setSize] = useState<2 | 3>(3);
  
  // Local state grid for current editing values
  const [gridValues, setGridValues] = useState<number[][]>(() => [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);

  const [lastResult, setLastResult] = useState<{
    type: "matrix" | "scalar" | null;
    label: string;
    matrixVal?: Matrix;
    scalarVal?: number;
    error?: string;
  }>({ type: null, label: "" });

  const loadMatrixValues = (target: "A" | "B" | "C") => {
    setEditingTarget(target);
    const existing = matrices[target];
    if (existing) {
      setSize(existing.length as 2 | 3);
      const newGrid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let r = 0; r < existing.length; r++) {
        for (let c = 0; c < existing[r].length; c++) {
          newGrid[r][c] = existing[r][c];
        }
      }
      setGridValues(newGrid);
    } else {
      setGridValues([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    }
  };

  const handleCellChange = (r: number, c: number, rawVal: string) => {
    let parsed = parseFloat(rawVal);
    if (isNaN(parsed)) parsed = 0;
    const newGrid = gridValues.map((rowArr, rowIdx) =>
      rowArr.map((val, colIdx) => (rowIdx === r && colIdx === c ? parsed : val))
    );
    setGridValues(newGrid);
  };

  const saveMatrix = () => {
    // Truncate to size
    const finalMat: Matrix = gridValues
      .slice(0, size)
      .map((row) => row.slice(0, size));
    onUpdateMatrix(editingTarget, finalMat);
  };

  const clearMatrix = () => {
    setGridValues([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    onUpdateMatrix(editingTarget, null);
  };

  // Operations runners
  const runOperation = (op: string) => {
    try {
      const matA = matrices.A;
      const matB = matrices.B;
      const matC = matrices.C;

      switch (op) {
        case "A+B":
          if (!matA || !matB) throw new Error("Define Matrix A and B first.");
          setLastResult({
            type: "matrix",
            label: "Matrix (A + B)",
            matrixVal: matrixAdd(matA, matB),
          });
          break;
        case "A-B":
          if (!matA || !matB) throw new Error("Define Matrix A and B first.");
          setLastResult({
            type: "matrix",
            label: "Matrix (A - B)",
            matrixVal: matrixSub(matA, matB),
          });
          break;
        case "A*B":
          if (!matA || !matB) throw new Error("Define Matrix A and B first.");
          setLastResult({
            type: "matrix",
            label: "Matrix (A × B)",
            matrixVal: matrixMul(matA, matB),
          });
          break;
        case "det(A)":
          if (!matA) throw new Error("Define Matrix A first.");
          setLastResult({
            type: "scalar",
            label: "Determinant of A",
            scalarVal: matrixDeterminant(matA),
          });
          break;
        case "inv(A)":
          if (!matA) throw new Error("Define Matrix A first.");
          setLastResult({
            type: "matrix",
            label: "Inverse of Matrix A",
            matrixVal: matrixInverse(matA),
          });
          break;
        case "trans(A)":
          if (!matA) throw new Error("Define Matrix A first.");
          setLastResult({
            type: "matrix",
            label: "Transpose of Matrix A",
            matrixVal: matrixTranspose(matA),
          });
          break;
        case "det(B)":
          if (!matB) throw new Error("Define Matrix B first.");
          setLastResult({
            type: "scalar",
            label: "Determinant of B",
            scalarVal: matrixDeterminant(matB),
          });
          break;
        case "inv(B)":
          if (!matB) throw new Error("Define Matrix B first.");
          setLastResult({
            type: "matrix",
            label: "Inverse of Matrix B",
            matrixVal: matrixInverse(matB),
          });
          break;
        case "trans(B)":
          if (!matB) throw new Error("Define Matrix B first.");
          setLastResult({
            type: "matrix",
            label: "Transpose of Matrix B",
            matrixVal: matrixTranspose(matB),
          });
          break;
        default:
          throw new Error("Unknown operation");
      }
    } catch (err: any) {
      setLastResult({
        type: null,
        label: "Calculation Failed",
        error: err.message || "Matrix ERROR",
      });
    }
  };

  return (
    <div
      id="mode_matrix_panel"
      className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-4 shadow-lg animate-[fadeIn_0.25s_ease-out]"
    >
      <div className="flex flex-col gap-1 border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
          Matrix Mode Calculator
        </h3>
        <p className="text-[10px] text-zinc-500">
          Set vectors and compute determinant, inverse, or multiplier matrices.
        </p>
      </div>

      {/* Target Selector */}
      <div className="flex gap-2">
        {(["A", "B", "C"] as const).map((name) => (
          <button
            key={name}
            id={`btn_load_matrix_${name.toLowerCase()}`}
            onClick={() => loadMatrixValues(name)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold cursor-pointer border transition-all ${
              editingTarget === name
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400"
            }`}
          >
            Mat {name} {matrices[name] ? `(${matrices[name]!.length}x${matrices[name]![0].length})` : "(Undefined)"}
          </button>
        ))}
      </div>

      {/* Configuration Zone */}
      <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-900 flex flex-col gap-3">
        {/* Dimensions toggles */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">Dimensions:</span>
          <div className="flex gap-1.5">
            {([2, 3] as const).map((dim) => (
              <button
                key={dim}
                id={`btn_matrix_dim_${dim}`}
                onClick={() => setSize(dim)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono cursor-pointer font-bold ${
                  size === dim
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-zinc-900 hover:bg-zinc-805 text-zinc-500"
                }`}
              >
                {dim} × {dim}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid Input spreadsheet */}
        <div className="grid gap-2 justify-center my-1">
          {Array.from({ length: size }).map((_, rIdx) => (
            <div key={rIdx} className="flex gap-2">
              {Array.from({ length: size }).map((_, cIdx) => (
                <input
                  key={cIdx}
                  type="number"
                  step="any"
                  value={gridValues[rIdx][cIdx] || ""}
                  placeholder="0"
                  id={`input_matrix_${editingTarget.toLowerCase()}_${rIdx}_${cIdx}`}
                  onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                  className="w-16 md:w-20 text-center font-mono py-1 rounded bg-zinc-950 border border-zinc-850 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-800 text-xs text-semibold shadow-inner"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Local save/clear buttons */}
        <div className="flex gap-2 mt-1">
          <button
            id={`btn_save_matrix_${editingTarget.toLowerCase()}`}
            onClick={saveMatrix}
            className="flex-1 py-1 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-extrabold font-sans rounded-lg text-xs cursor-pointer shadow-md"
          >
            Save to Mat {editingTarget}
          </button>
          <button
            id={`btn_clear_matrix_${editingTarget.toLowerCase()}`}
            onClick={clearMatrix}
            className="py-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans rounded-lg text-xs cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Arithmetic Command keys */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-zinc-400">Perform Operations:</span>
        <div className="grid grid-cols-3 gap-2">
          {["A+B", "A-B", "A*B", "det(A)", "inv(A)", "trans(A)", "det(B)", "inv(B)", "trans(B)"].map((action) => (
            <button
              key={action}
              id={`btn_op_matrix_${action.replace(/[+*()-]/g, "_").toLowerCase()}`}
              onClick={() => runOperation(action)}
              className="py-1 px-2 text-[10px] font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-300 rounded cursor-pointer transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Computed Result Box */}
      {lastResult.label && (
        <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-900 flex flex-col gap-2 animate-[fadeIn_0.2s_ease-out] shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
            {lastResult.label}
          </span>

          {lastResult.error ? (
            <span className="text-xs font-mono text-rose-400 font-medium">{lastResult.error}</span>
          ) : lastResult.type === "scalar" ? (
            <div className="text-md font-mono font-bold text-zinc-200">
              = {formatFloat(lastResult.scalarVal!)}
            </div>
          ) : lastResult.matrixVal ? (
            <div className="flex flex-col gap-1.5 justify-center mt-1 items-center bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-900">
              {lastResult.matrixVal.map((row, r) => (
                <div key={r} className="flex gap-2.5 font-mono text-xs">
                  {row.map((val, c) => (
                    <span key={c} className="w-16 text-center text-zinc-150 font-bold border border-zinc-800 py-0.5 rounded bg-zinc-950 font-mono">
                      {formatFloat(val)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
