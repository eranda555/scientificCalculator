/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CalcMode {
  COMP = "COMP",       // General Computation
  CMPLX = "CMPLX",     // Complex Numbers
  BASE_N = "BASE-N",   // Binary, Octal, Decimal, Hexadecimal
  MATRIX = "MATRIX",   // Matrix Operations (A, B, C)
  EQN = "EQN",         // Equation solvers (Systems & Polynomials)
  STAT = "STAT",       // Statistical computations
  CONV = "CONV"        // Unit conversions
}

export type AngleMode = "DEG" | "RAD" | "GRAD";

export type BaseNMode = "DEC" | "HEX" | "BIN" | "OCT";

export interface Complex {
  re: number;
  im: number;
}

export type Matrix = number[][]; // Row-major double-nested array

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  mode: CalcMode;
  timestamp: string;
}

// Variables stored in memory
export interface CalcVariables {
  A: number | Complex;
  B: number | Complex;
  C: number | Complex;
  D: number | Complex;
  E: number | Complex;
  F: number | Complex;
  X: number | Complex;
  Y: number | Complex;
  M: number | Complex; // Memory storage
}

// State representing Matrix items A, B, C
export interface MatrixStorage {
  A: Matrix | null;
  B: Matrix | null;
  C: Matrix | null;
}

// EQN Mode structures
export type EqnType = "SIMUL_2" | "SIMUL_3" | "POLY_2" | "POLY_3";

export interface EqnState {
  type: EqnType;
  // Coefficients for SIMUL_2: a1, b1, c1; a2, b2, c2
  // Coefficients for SIMUL_3: a1, b1, c1, d1; etc.
  // Coefficients for POLY_2: a, b, c
  // Coefficients for POLY_3: a, b, c, d
  coefficients: number[];
  results: string[] | null;
  error: string | null;
}

// Statistical data state
export interface StatState {
  data: number[];
  inputVal: string;
}

// Constants for Scientific Reference
export interface ScientificConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
}

// Unit Converters configurations
export interface UnitCategory {
  name: string;
  units: { name: string; symbol: string; factor: number; offset?: number }[];
}

export interface UnitConvState {
  categoryIdx: number;
  fromIdx: number;
  toIdx: number;
  value: string;
  result: number | null;
}
