/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UNIT_CONVERSION_CATEGORIES, convertUnits, formatFloat } from "../../utils/mathEngine";

export default function ModeConvert() {
  const [catIdx, setCatIdx] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [valueStr, setValueStr] = useState("1");
  const [result, setResult] = useState<number | null>(null);

  const activeCategory = UNIT_CONVERSION_CATEGORIES[catIdx];

  // Run conversion on dependencies modification
  useEffect(() => {
    const val = convertUnits(catIdx, fromIdx, toIdx, valueStr);
    setResult(val);
  }, [catIdx, fromIdx, toIdx, valueStr]);

  const handleCategoryChange = (newIdx: number) => {
    setCatIdx(newIdx);
    setFromIdx(0);
    setToIdx(Math.min(1, UNIT_CONVERSION_CATEGORIES[newIdx].units.length - 1));
  };

  return (
    <div
      id="mode_convert_panel"
      className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-4 shadow-lg animate-[fadeIn_0.25s_ease-out]"
    >
      <div className="flex flex-col gap-0.5 border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
          Unit Converter Utility
        </h3>
        <p className="text-[10px] text-zinc-500">
          Transform raw physical metrics using exact modern scaling standards.
        </p>
      </div>

      {/* Category selector row */}
      <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {UNIT_CONVERSION_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.name}
            id={`btn_convert_cat_${cat.name.toLowerCase()}`}
            onClick={() => handleCategoryChange(idx)}
            className={`py-1 px-3 rounded-lg text-[10px] font-sans font-semibold cursor-pointer whitespace-nowrap border-b-2 transition-all ${
              catIdx === idx
                ? "bg-zinc-900 text-zinc-200 border-zinc-400"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-450 border-transparent"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Converter workspace */}
      <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-900 flex flex-col gap-3">
        {/* Value Inputs */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider">
            Source value
          </label>
          <input
            type="number"
            step="any"
            placeholder="Enter value"
            value={valueStr}
            id="input_convert_source"
            onChange={(e) => setValueStr(e.target.value)}
            className="w-full font-mono py-1 px-2.5 rounded bg-zinc-950 border border-zinc-850 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-800/45 text-xs text-semibold shadow-inner"
          />
        </div>

        {/* Translation selects */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider">
              From Unit
            </label>
            <select
              id="select_convert_from"
              value={fromIdx}
              onChange={(e) => setFromIdx(parseInt(e.target.value))}
              className="py-1 px-2 rounded bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono text-xs focus:outline-none cursor-pointer focus:ring-1 focus:ring-zinc-800/45"
            >
              {activeCategory.units.map((unit, idx) => (
                <option key={unit.symbol} value={idx}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider">
              To Unit
            </label>
            <select
              id="select_convert_to"
              value={toIdx}
              onChange={(e) => setToIdx(parseInt(e.target.value))}
              className="py-1 px-2 rounded bg-zinc-950 border border-zinc-850 text-zinc-300 font-mono text-xs focus:outline-none cursor-pointer focus:ring-1 focus:ring-zinc-800/45"
            >
              {activeCategory.units.map((unit, idx) => (
                <option key={unit.symbol} value={idx}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Output HUD */}
      {result !== null && (
        <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-900 flex flex-col gap-1 animate-[fadeIn_0.2s_ease-out] shadow-md">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Conversion Result:
          </span>
          <div className="text-md font-mono font-bold text-zinc-100 flex justify-between items-center pr-1.5 pl-0.5">
            <span className="text-zinc-500">
              {valueStr || "0"} {activeCategory.units[fromIdx]?.symbol || ""}
            </span>
            <span className="text-emerald-400 text-right overflow-x-auto whitespace-nowrap pl-4 scrollbar-none font-extrabold text-sm">
              = {formatFloat(result)} {activeCategory.units[toIdx]?.symbol || ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
