/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BaseNMode } from "../../types";
import { formatBaseN, parseBaseN } from "../../utils/mathEngine";

interface ModeBaseNProps {
  currentValueStr: string;
  baseMode: BaseNMode;
  onSelectBase: (base: BaseNMode) => void;
}

export default function ModeBaseN({
  currentValueStr,
  baseMode,
  onSelectBase,
}: ModeBaseNProps) {
  // Compute numerical equivalent integer
  let intValue = 0;
  let parseError = false;
  try {
    intValue = parseBaseN(currentValueStr || "0", baseMode);
  } catch (err) {
    parseError = true;
  }

  const bases: { type: BaseNMode; label: string; bg: string }[] = [
    { type: "DEC", label: "DEC (Decimal)", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    { type: "HEX", label: "HEX (Hexadecimal)", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    { type: "BIN", label: "BIN (Binary)", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    { type: "OCT", label: "OCT (Octal)", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  ];

  return (
    <div
      id="mode_base_n_panel"
      className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 flex flex-col gap-3 shadow-lg"
    >
      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
          Base-N conversions
        </h3>
        <span className="text-[10px] bg-zinc-900 text-zinc-300 font-mono px-2 py-0.5 rounded-full border border-zinc-850">
          Active: {baseMode}
        </span>
      </div>

      {/* Base selection toggles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {bases.map((b) => (
          <button
            key={b.type}
            id={`btn_base_${b.type.toLowerCase()}`}
            onClick={() => onSelectBase(b.type)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all cursor-pointer ${
              baseMode === b.type
                ? "bg-zinc-100 text-zinc-950 border-zinc-200 shadow-md scale-[1.02]"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
            }`}
          >
            {b.type}
          </button>
        ))}
      </div>

      {/* Real-time representations table */}
      <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-900 flex flex-col gap-2.5">
        {bases.map((b) => {
          let representation = "0";
          if (!parseError) {
            try {
              representation = formatBaseN(intValue, b.type);
            } catch {
              representation = "Error";
            }
          } else {
            representation = "Syntax ERROR";
          }

          // Break long binaries with spaces
          if (b.type === "BIN" && representation !== "Syntax ERROR" && representation !== "Error") {
            // Group bits in 4s or 8s for readability
            representation = representation.replace(/(.{4})/g, "$1 ").trim();
          }

          return (
            <div
              key={b.type}
              className="flex justify-between items-center text-xs border-b border-zinc-900/60 last:border-0 pb-1.5 last:pb-0"
            >
              <span className="text-zinc-500 font-semibold font-mono tracking-wider w-10">
                {b.type}:
              </span>
              <span className="font-mono text-zinc-300 select-all overflow-x-auto whitespace-nowrap scrollbar-none w-full text-right pl-3 font-semibold">
                {representation}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-zinc-600 leading-relaxed italic">
        * Use standard keypad digit restrictions automatically applied. Letters A-F are available using the corresponding keys during Hex input.
      </div>
    </div>
  );
}
