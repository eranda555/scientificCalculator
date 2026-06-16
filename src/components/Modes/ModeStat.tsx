/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { formatFloat } from "../../utils/mathEngine";

export default function ModeStat() {
  const [data, setData] = useState<number[]>(() => [12.5, 15, 10.2, 17.8, 14]);
  const [inputVal, setInputVal] = useState("");

  const handleAddData = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) {
      setData([...data, parsed]);
      setInputVal("");
    }
  };

  const handleRemoveData = (idx: number) => {
    setData(data.filter((_, i) => i !== idx));
  };

  const handleClearData = () => {
    setData([]);
  };

  // Compute stats in real-time
  const computeStats = () => {
    const N = data.length;
    if (N === 0) return null;

    const sumX = data.reduce((acc, curr) => acc + curr, 0);
    const sumX2 = data.reduce((acc, curr) => acc + curr * curr, 0);
    const mean = sumX / N;
    
    // Population Variance and Std Dev
    const variancePop = (sumX2 / N) - (mean * mean);
    const stdDevPop = variancePop > 0 ? Math.sqrt(variancePop) : 0;

    // Sample Variance and Std Dev
    let stdDevSample = 0;
    if (N > 1) {
      const varianceSample = (sumX2 - (sumX * sumX) / N) / (N - 1);
      stdDevSample = varianceSample > 0 ? Math.sqrt(varianceSample) : 0;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);

    return {
      N,
      sumX,
      sumX2,
      mean,
      stdDevPop,
      stdDevSample,
      min,
      max,
    };
  };

  const stats = computeStats();

  return (
    <div
      id="mode_stat_panel"
      className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-4 shadow-lg animate-[fadeIn_0.25s_ease-out]"
    >
      <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
          List Statistics Mode
        </h3>
        <p className="text-[10px] text-zinc-500">
          Enter single-variable statistical data to compute population metrics instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Interactive Data Input Table */}
        <div className="flex flex-col gap-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
          <span className="text-[11px] font-semibold text-zinc-400 border-b border-zinc-900 pb-1.5 flex justify-between items-center">
            <span>Observation Dataset</span>
            <button
              id="btn_stat_clear_dataset"
              onClick={handleClearData}
              className="text-[10px] text-rose-500 hover:text-rose-400 font-medium cursor-pointer transition-colors"
            >
              Clear All
            </button>
          </span>

          <form onSubmit={handleAddData} className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Enter value"
              value={inputVal}
              id="input_stat_entry"
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 font-mono py-1 px-2.5 rounded bg-zinc-950 border border-zinc-850 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-800 text-xs text-semibold shadow-inner"
            />
            <button
              type="submit"
              id="btn_stat_add_entry"
              className="py-1 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-extrabold font-sans rounded text-xs cursor-pointer flex items-center gap-1 shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Add
            </button>
          </form>

          {/* List display */}
          <div className="max-h-36 overflow-y-auto border border-zinc-900 rounded bg-zinc-950/60 mt-1 scrollbar-thin scrollbar-thumb-zinc-805">
            {data.length === 0 ? (
              <div className="text-[10px] italic text-zinc-605 text-center py-4 font-mono">
                No observations entered.
              </div>
            ) : (
              <table className="w-full text-xs font-mono">
                <thead className="bg-zinc-950 text-zinc-500 text-[10px]">
                  <tr>
                    <th className="py-1 px-2 text-left font-normal border-b border-zinc-900">Index</th>
                    <th className="py-1 px-2 text-right font-normal border-b border-zinc-900">Value (x)</th>
                    <th className="py-1 px-2 text-center font-normal border-b border-zinc-900 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((val, idx) => (
                    <tr key={idx} className="border-b border-zinc-900/60 hover:bg-zinc-900/30">
                      <td className="py-1 px-2 text-zinc-500">{idx + 1}</td>
                      <td className="py-1 px-2 text-right text-zinc-200 font-semibold">{formatFloat(val)}</td>
                      <td className="py-1 px-2 text-center">
                        <button
                          id={`btn_stat_delete_idx_${idx}`}
                          onClick={() => handleRemoveData(idx)}
                          className="hover:text-rose-455 text-zinc-650 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Instantly Parsed Statistics HUD */}
        <div className="flex flex-col gap-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900">
          <span className="text-[11px] font-semibold text-zinc-400 border-b border-zinc-900 pb-1.5 leading-tight">
            Descriptive Statistics Result
          </span>

          {!stats ? (
            <div className="text-xs text-zinc-550 italic text-center py-10 font-mono">
              Add observations to begin...
            </div>
          ) : (
            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Count (n):</span>
                <span className="text-emerald-400 font-bold">{stats.N}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Mean (μ):</span>
                <span className="text-zinc-300 font-bold">{formatFloat(stats.mean)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Sum (∑x):</span>
                <span className="text-zinc-300 font-bold">{formatFloat(stats.sumX)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Sum Sq (∑x²):</span>
                <span className="text-zinc-300 font-bold">{formatFloat(stats.sumX2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Pop Std Dev (σx):</span>
                <span className="text-zinc-200 font-bold">{formatFloat(stats.stdDevPop)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-1">
                <span className="text-zinc-500">Sample Std Dev (sx):</span>
                <span className="text-zinc-200 font-bold">
                  {stats.N > 1 ? formatFloat(stats.stdDevSample) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Range:</span>
                <span className="text-zinc-400">
                  [{formatFloat(stats.min)} to {formatFloat(stats.max)}]
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
