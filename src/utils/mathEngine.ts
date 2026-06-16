/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalcMode, AngleMode, BaseNMode, Complex, Matrix, CalcVariables, ScientificConstant } from "../types";

// ==========================================
// 1. COMPLEX NUMBER MATHEMATICS HELPER FUNCTIONS
// ==========================================

export const complexOf = (re: number, im = 0): Complex => ({ re, im });

export const c_add = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});

export const c_sub = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im,
});

export const c_mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const c_div = (a: Complex, b: Complex): Complex => {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) throw new Error("Math ERROR: Division by Zero");
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
};

export const c_abs = (a: Complex): number => Math.sqrt(a.re * a.re + a.im * a.im);

export const c_arg = (a: Complex): number => Math.atan2(a.im, a.re); // Radians

export const c_conj = (a: Complex): Complex => ({ re: a.re, im: -a.im });

export const c_neg = (a: Complex): Complex => ({ re: -a.re, im: -a.im });

export const c_exp = (a: Complex): Complex => {
  const expRe = Math.exp(a.re);
  return {
    re: expRe * Math.cos(a.im),
    im: expRe * Math.sin(a.im),
  };
};

export const c_ln = (a: Complex): Complex => {
  const r = c_abs(a);
  if (r === 0) throw new Error("Math ERROR: Log of 0");
  return {
    re: Math.log(r),
    im: c_arg(a),
  };
};

// Complex Power: w^z = exp(z * ln(w))
export const c_pow = (w: Complex, z: Complex): Complex => {
  if (w.re === 0 && w.im === 0) {
    if (z.re === 0 && z.im === 0) return complexOf(1, 0);
    return complexOf(0, 0);
  }
  return c_exp(c_mul(z, c_ln(w)));
};

export const c_sqrt = (a: Complex): Complex => {
  const r = c_abs(a);
  const re = Math.sqrt((r + a.re) / 2);
  const im = Math.sign(a.im || 1) * Math.sqrt((r - a.re) / 2);
  return { re, im };
};

export const c_cbrt = (a: Complex): Complex => {
  const r = c_abs(a);
  if (r === 0) return complexOf(0, 0);
  const theta = c_arg(a);
  const rootR = Math.cbrt(r);
  return {
    re: rootR * Math.cos(theta / 3),
    im: rootR * Math.sin(theta / 3),
  };
};

// Factorial helper
export const factorial = (n: number): number => {
  if (n < 0 || !Number.isInteger(n)) throw new Error("Math ERROR: Requires non-negative integer");
  if (n > 170) throw new Error("Infinite/Overflow ERROR");
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

// ==========================================
// 2. SCIENTIFIC CONSTANTS LIST (Casio Reference)
// ==========================================

export const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  { symbol: "c", name: "Speed of Light", value: 299792458, unit: "m/s" },
  { symbol: "G", name: "Newtonian Gravitational Constant", value: 6.6743e-11, unit: "m³ / kg s²" },
  { symbol: "h", name: "Planck Constant", value: 6.62607015e-34, unit: "J s" },
  { symbol: "g", name: "Standard Acceleration of Gravity", value: 9.80665, unit: "m/s²" },
  { symbol: "e_q", name: "Elementary Charge", value: 1.602176634e-19, unit: "C" },
  { symbol: "me", name: "Electron Mass", value: 9.1093837015e-31, unit: "kg" },
  { symbol: "mp", name: "Proton Mass", value: 1.67262192369e-27, unit: "kg" },
  { symbol: "mn", name: "Neutron Mass", value: 1.67492749804e-27, unit: "kg" },
  { symbol: "R_gas", name: "Molar Gas Constant", value: 8.314462618, unit: "J / mol K" },
  { symbol: "NA", name: "Avogadro Constant", value: 6.02214076e23, unit: "1/mol" },
  { symbol: "k_B", name: "Boltzmann Constant", value: 1.380649e-23, unit: "J/K" },
  { symbol: "F_far", name: "Faraday Constant", value: 96485.33212, unit: "C/mol" },
  { symbol: "ε0", name: "Vacuum Electric Permittivity", value: 8.8541878128e-12, unit: "F/m" },
  { symbol: "μ0", name: "Vacuum Magnetic Permeability", value: 1.25663706212e-6, unit: "N/A²" },
];

// ==========================================
// 3. ANGLE CONVERSION HANDLERS
// ==========================================

export const toRadians = (val: number, mode: AngleMode): number => {
  if (mode === "DEG") return (val * Math.PI) / 180;
  if (mode === "GRAD") return (val * Math.PI) / 200;
  return val; // RAD
};

export const fromRadians = (rad: number, mode: AngleMode): number => {
  if (mode === "DEG") return (rad * 180) / Math.PI;
  if (mode === "GRAD") return (rad * 200) / Math.PI;
  return rad; // RAD
};

// ==========================================
// 4. PARSER & EVALUATOR: GENERAL COMP & COMPLEX
// ==========================================

interface Token {
  type: "NUMBER" | "OPERATOR" | "LPAREN" | "RPAREN" | "COMMA" | "FUNCTION" | "VARIABLE" | "CONSTANT";
  value: string;
}

// Tokenize standard arithmetic and functions
const tokenize = (expr: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;

  // Clean raw spaces
  const cleanExpr = expr.replace(/\s+/g, "");

  const functions = [
    "asinh", "acosh", "atanh", "sinh", "cosh", "tanh",
    "asin", "acos", "atan", "sin", "cos", "tan",
    "logBase", "log", "ln", "sqrt", "cbrt", "abs", "fact"
  ];

  const constants = SCIENTIFIC_CONSTANTS.map(c => c.symbol).concat(["pi", "e"]);
  const variables = ["A", "B", "C", "D", "E", "F", "X", "Y", "M"];

  while (i < cleanExpr.length) {
    const char = cleanExpr[i];

    // Numbers (including scientific notation like 1.23e-4 or complex term like 2i, 3.5i, or standalone 'i')
    if (/[0-9.]/.test(char) || (char === "i" && (i === 0 || !/[a-zA-Z_]/.test(cleanExpr[i - 1])))) {
      let numStr = "";
      while (i < cleanExpr.length && /[0-9.eE+-]/.test(cleanExpr[i])) {
        // Lookahead to make sure +/- is part of exponent
        if ((cleanExpr[i] === "+" || cleanExpr[i] === "-") && !/[eE]/.test(numStr)) {
          break;
        }
        numStr += cleanExpr[i];
        i++;
      }
      
      // Check if followed by 'i' symbol (complex number)
      if (i < cleanExpr.length && cleanExpr[i] === "i") {
        numStr += "i";
        i++;
      }

      tokens.push({ type: "NUMBER", value: numStr });
      continue;
    }

    // Comma
    if (char === ",") {
      tokens.push({ type: "COMMA", value: "," });
      i++;
      continue;
    }

    // Parentheses
    if (char === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    // Operators
    if (["+", "-", "*", "/", "^", "!"].includes(char)) {
      tokens.push({ type: "OPERATOR", value: char });
      i++;
      continue;
    }

    // Check for Word tokens: Functions, Constants, variables
    let matched = false;

    // 1. Check functions
    for (const fn of functions) {
      if (cleanExpr.startsWith(fn, i)) {
        tokens.push({ type: "FUNCTION", value: fn });
        i += fn.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Check scientific constants
    for (const constant of constants) {
      if (cleanExpr.startsWith(constant, i)) {
        tokens.push({ type: "CONSTANT", value: constant });
        i += constant.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 3. Check variables
    for (const v of variables) {
      if (cleanExpr.startsWith(v, i)) {
        tokens.push({ type: "VARIABLE", value: v });
        i += v.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // If we reach here, it is an unrecognized symbol
    throw new Error(`Syntax ERROR: Unexpected char '${char}'`);
  }

  // Handle implicit multiplication (e.g. 2pi -> 2 * pi, (2+3)(4+5) -> (2+3) * (4+5), 2X -> 2 * X, sin(pi)cos(pi))
  const processedTokens: Token[] = [];
  for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
    const current = tokens[tIdx];
    processedTokens.push(current);

    if (tIdx < tokens.length - 1) {
      const next = tokens[tIdx + 1];

      const currentIsOperand = ["NUMBER", "VARIABLE", "CONSTANT", "RPAREN"].includes(current.type) || current.value === "!";
      const nextIsOperand = ["NUMBER", "VARIABLE", "CONSTANT", "LPAREN", "FUNCTION"].includes(next.type);

      // Avoid placing multiplication before post-fix '!' operator
      if (currentIsOperand && nextIsOperand && next.value !== "!") {
        processedTokens.push({ type: "OPERATOR", value: "*" });
      }
    }
  }

  return processedTokens;
};

// Shunting-Yard Algorithm to convert Infix to RPN (Postfix)
const shuntingYard = (tokens: Token[]): Token[] => {
  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "neg": 3, // unary negative
    "^": 4,
    "!": 5, // postfix factorial
  };

  const isLeftAssociative: Record<string, boolean> = {
    "+": true,
    "-": true,
    "*": true,
    "/": true,
    "neg": false,
    "^": false, // Power is right-associative (or handled standard)
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Numbers, variables, constants, are pushed directly
    if (token.type === "NUMBER" || token.type === "VARIABLE" || token.type === "CONSTANT") {
      outputQueue.push(token);
      continue;
    }

    // Function tokens are pushed to stack
    if (token.type === "FUNCTION") {
      operatorStack.push(token);
      continue;
    }

    // Comma restarts high/low arguments tracking
    if (token.type === "COMMA") {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== "LPAREN") {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) {
        throw new Error("Syntax ERROR: Comma misplaced or Parenthesis mismatch");
      }
      continue;
    }

    // Operators
    if (token.type === "OPERATOR") {
      let op = token.value;

      // Determine if unary minus/plus
      if (op === "-" || op === "+") {
        const prev = i > 0 ? tokens[i - 1] : null;
        const isUnary = !prev || prev.type === "OPERATOR" || prev.type === "LPAREN" || prev.type === "COMMA";
        if (isUnary) {
          if (op === "-") {
            op = "neg"; // rename operator
          } else {
            // Unary plus does nothing
            continue;
          }
        }
      }

      const currentPrecedence = precedence[op];

      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === "OPERATOR"
      ) {
        const topOp = operatorStack[operatorStack.length - 1].value;
        const topPrecedence = precedence[topOp];

        if (
          (isLeftAssociative[op] && currentPrecedence <= topPrecedence) ||
          (!isLeftAssociative[op] && currentPrecedence < topPrecedence)
        ) {
          outputQueue.push(operatorStack.pop()!);
        } else {
          break;
        }
      }

      operatorStack.push({ type: "OPERATOR", value: op });
      continue;
    }

    // Left parenthesis
    if (token.type === "LPAREN") {
      operatorStack.push(token);
      continue;
    }

    // Right parenthesis
    if (token.type === "RPAREN") {
      let foundMatching = false;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type === "LPAREN") {
          operatorStack.pop(); // discard LPAREN
          foundMatching = true;
          break;
        } else {
          outputQueue.push(operatorStack.pop()!);
        }
      }
      if (!foundMatching) {
        throw new Error("Syntax ERROR: Mismatched Parentheses");
      }

      // If top of stack is a function, pop it onto output queue
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === "FUNCTION") {
        outputQueue.push(operatorStack.pop()!);
      }
    }
  }

  // Pop remaining operators from stack
  while (operatorStack.length > 0) {
    const top = operatorStack[operatorStack.length - 1];
    if (top.type === "LPAREN" || top.type === "RPAREN") {
      throw new Error("Syntax ERROR: Mismatched Parentheses");
    }
    outputQueue.push(operatorStack.pop()!);
  }

  return outputQueue;
};

// Evaluate the Postfix representation (RPN) returning a Complex representation
const evaluateRPN = (
  rpn: Token[],
  angleMode: AngleMode,
  calcMode: CalcMode,
  variables: CalcVariables
): Complex => {
  const stack: Complex[] = [];

  const resolveVal = (t: Token): Complex => {
    if (t.type === "NUMBER") {
      if (t.value.endsWith("i")) {
        if (t.value === "i") return complexOf(0, 1);
        const coefficient = parseFloat(t.value.slice(0, -1));
        return complexOf(0, isNaN(coefficient) ? 1 : coefficient);
      }
      return complexOf(parseFloat(t.value));
    }
    if (t.type === "VARIABLE") {
      const vVal = variables[t.value as keyof CalcVariables];
      if (typeof vVal === "number") return complexOf(vVal);
      return vVal; // Complex
    }
    if (t.type === "CONSTANT") {
      if (t.value === "pi") return complexOf(Math.PI);
      if (t.value === "e") return complexOf(Math.E);
      const cObj = SCIENTIFIC_CONSTANTS.find(c => c.symbol === t.value);
      if (cObj) return complexOf(cObj.value);
    }
    throw new Error(`Math ERROR: Unknown term ${t.value}`);
  };

  for (const token of rpn) {
    if (token.type === "NUMBER" || token.type === "VARIABLE" || token.type === "CONSTANT") {
      stack.push(resolveVal(token));
      continue;
    }

    if (token.type === "OPERATOR") {
      if (token.value === "neg") {
        const op1 = stack.pop();
        if (!op1) throw new Error("Syntax ERROR: Unary negative missing operand");
        stack.push(c_neg(op1));
        continue;
      }
      if (token.value === "!") {
        const op1 = stack.pop();
        if (!op1) throw new Error("Syntax ERROR: Factorial missing operand");
        if (op1.im !== 0) throw new Error("Math ERROR: Factorial of complex is undefined");
        stack.push(complexOf(factorial(op1.re)));
        continue;
      }

      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) throw new Error(`Syntax ERROR: Binary operational missing operand for '${token.value}'`);

      switch (token.value) {
        case "+":
          stack.push(c_add(left, right));
          break;
        case "-":
          stack.push(c_sub(left, right));
          break;
        case "*":
          stack.push(c_mul(left, right));
          break;
        case "/":
          stack.push(c_div(left, right));
          break;
        case "^":
          // If we are in real computation mode, protect domains (e.g. negative to fractional powers can be complex)
          if (calcMode === CalcMode.COMP && left.im === 0 && right.im === 0) {
            if (left.re < 0 && !Number.isInteger(right.re)) {
              throw new Error("Math ERROR: Complex result in COMP mode. Select CMPLX mode.");
            }
          }
          stack.push(c_pow(left, right));
          break;
        default:
          throw new Error(`Syntax ERROR: Unknown operator ${token.value}`);
      }
      continue;
    }

    if (token.type === "FUNCTION") {
      const fn = token.value;

      if (fn === "logBase") {
        const xVal = stack.pop();
        const baseVal = stack.pop(); // first argument pushed first, so popped second
        if (!baseVal || !xVal) throw new Error(`Syntax ERROR: logBase requires 2 parameters`);
        const lnX = c_ln(xVal);
        const lnBase = c_ln(baseVal);
        stack.push(c_div(lnX, lnBase));
        continue;
      }

      const arg = stack.pop();
      if (!arg) throw new Error(`Syntax ERROR: Function '${fn}' missing parameter`);

      switch (fn) {
        case "sin": {
          if (arg.im !== 0) {
            // Complex Sin: sin(x+iy) = sin(x)cosh(y) + i cos(x)sinh(y)
            const x = toRadians(arg.re, angleMode);
            const y = arg.im; // keep hyper as radians always standard
            stack.push({
              re: Math.sin(x) * Math.cosh(y),
              im: Math.cos(x) * Math.sinh(y),
            });
          } else {
            const rad = toRadians(arg.re, angleMode);
            // Casio trims very small epsilon values close to zero to make clean displays (e.g. sin(180) returns 0 exact)
            let result = Math.sin(rad);
            if (Math.abs(result) < 1e-15) result = 0;
            stack.push(complexOf(result));
          }
          break;
        }
        case "cos": {
          if (arg.im !== 0) {
            // Complex Cos: cos(x+iy) = cos(x)cosh(y) - i sin(x)sinh(y)
            const x = toRadians(arg.re, angleMode);
            const y = arg.im;
            stack.push({
              re: Math.cos(x) * Math.cosh(y),
              im: -Math.sin(x) * Math.sinh(y),
            });
          } else {
            const rad = toRadians(arg.re, angleMode);
            let result = Math.cos(rad);
            if (Math.abs(result) < 1e-15) result = 0;
            stack.push(complexOf(result));
          }
          break;
        }
        case "tan": {
          if (arg.im !== 0) {
            // tan(z) = sin(z)/cos(z)
            const x = toRadians(arg.re, angleMode);
            const y = arg.im;
            const sz = { re: Math.sin(x) * Math.cosh(y), im: Math.cos(x) * Math.sinh(y) };
            const cz = { re: Math.cos(x) * Math.cosh(y), im: -Math.sin(x) * Math.sinh(y) };
            stack.push(c_div(sz, cz));
          } else {
            const rad = toRadians(arg.re, angleMode);
            if (Math.abs(Math.cos(rad)) < 1e-15) {
              throw new Error("Math ERROR: Tangent undefined (Division by zero)");
            }
            let result = Math.tan(rad);
            if (Math.abs(result) < 1e-15) result = 0;
            stack.push(complexOf(result));
          }
          break;
        }
        case "asin": {
          if (arg.im !== 0) {
            throw new Error("Math ERROR: Complex inverse trig unsupported");
          }
          if (arg.re < -1 || arg.re > 1) {
            if (calcMode === CalcMode.COMP) {
              throw new Error("Math ERROR: asin Domain limit [-1, 1] in COMP mode");
            }
            // Complex asin: -i * ln(i*z + sqrt(1 - z^2))
            const z = arg;
            const oneMinusZ2 = c_sub(complexOf(1), c_mul(z, z));
            const sqrtTerm = c_sqrt(oneMinusZ2);
            const iZ = c_mul(complexOf(0, 1), z);
            const lnTerm = c_ln(c_add(iZ, sqrtTerm));
            const asinVal = c_mul(complexOf(0, -1), lnTerm);
            stack.push({
              re: fromRadians(asinVal.re, angleMode),
              im: asinVal.im, // Imaginary part doesn't have degrees scaling
            });
          } else {
            stack.push(complexOf(fromRadians(Math.asin(arg.re), angleMode)));
          }
          break;
        }
        case "acos": {
          if (arg.im !== 0) {
            throw new Error("Math ERROR: Complex inverse trig unsupported");
          }
          if (arg.re < -1 || arg.re > 1) {
            if (calcMode === CalcMode.COMP) {
              throw new Error("Math ERROR: acos Domain limit [-1, 1] in COMP mode");
            }
            // Complex acos: pi/2 - asin(z)
            const z = arg;
            const oneMinusZ2 = c_sub(complexOf(1), c_mul(z, z));
            const sqrtTerm = c_sqrt(oneMinusZ2);
            const iZ = c_mul(complexOf(0, 1), z);
            const lnTerm = c_ln(c_add(iZ, sqrtTerm));
            const asinVal = c_mul(complexOf(0, -1), lnTerm);
            const finalRe = fromRadians(Math.PI / 2, angleMode) - fromRadians(asinVal.re, angleMode);
            stack.push({
              re: finalRe,
              im: -asinVal.im,
            });
          } else {
            stack.push(complexOf(fromRadians(Math.acos(arg.re), angleMode)));
          }
          break;
        }
        case "atan": {
          if (arg.im !== 0) {
            throw new Error("Math ERROR: Complex inverse trig unsupported");
          }
          stack.push(complexOf(fromRadians(Math.atan(arg.re), angleMode)));
          break;
        }
        case "sinh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          stack.push(complexOf(Math.sinh(arg.re)));
          break;
        case "cosh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          stack.push(complexOf(Math.cosh(arg.re)));
          break;
        case "tanh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          stack.push(complexOf(Math.tanh(arg.re)));
          break;
        case "asinh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          stack.push(complexOf(Math.asinh(arg.re)));
          break;
        case "acosh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          if (arg.re < 1) throw new Error("Math ERROR: acosh domain error (requires x >= 1)");
          stack.push(complexOf(Math.acosh(arg.re)));
          break;
        case "atanh":
          if (arg.im !== 0) throw new Error("Math ERROR: Complex hyperbolics unsupported");
          if (arg.re <= -1 || arg.re >= 1) throw new Error("Math ERROR: atanh domain error (requires -1 < x < 1)");
          stack.push(complexOf(Math.atanh(arg.re)));
          break;
        case "ln":
          if (calcMode === CalcMode.COMP && arg.re <= 0 && arg.im === 0) {
            throw new Error("Math ERROR: Log domain error (requires x > 0) in COMP mode");
          }
          stack.push(c_ln(arg));
          break;
        case "log": {
          if (calcMode === CalcMode.COMP && arg.re <= 0 && arg.im === 0) {
            throw new Error("Math ERROR: Log domain error (requires x > 0) in COMP mode");
          }
          const lnVal = c_ln(arg);
          stack.push(c_div(lnVal, c_ln(complexOf(10))));
          break;
        }
        case "sqrt":
          if (calcMode === CalcMode.COMP && arg.re < 0 && arg.im === 0) {
            throw new Error("Math ERROR: Negative square root in COMP mode. Select CMPLX mode.");
          }
          stack.push(c_sqrt(arg));
          break;
        case "cbrt":
          stack.push(c_cbrt(arg));
          break;
        case "abs":
          stack.push(complexOf(c_abs(arg)));
          break;
        case "fact":
          if (arg.im !== 0) throw new Error("Math ERROR: Factorial of complex is undefined");
          stack.push(complexOf(factorial(arg.re)));
          break;
        default:
          throw new Error(`Syntax ERROR: Unknown function '${fn}'`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error("Syntax ERROR: Incomplete formula");
  }

  return stack[0];
};

// Main execution entry point for computing expressions
export const evaluateExpression = (
  expr: string,
  angleMode: AngleMode,
  calcMode: CalcMode,
  variables: CalcVariables
): string => {
  if (!expr.trim()) return "";
  try {
    const tokens = tokenize(expr);
    const rpn = shuntingYard(tokens);
    const result = evaluateRPN(rpn, angleMode, calcMode, variables);

    // Format output
    if (result.im === 0) {
      // standard real
      const val = result.re;
      if (isNaN(val)) return "Error";
      if (!isFinite(val)) return "Infinity";
      
      // Trim minuscule float artifacts
      return formatFloat(val);
    } else {
      // complex standard dynamic format (e.g. 2 + 3i, or -i)
      const realStr = Math.abs(result.re) < 1e-12 ? "" : formatFloat(result.re);
      const absIm = Math.abs(result.im);
      
      let signStr = "";
      if (result.im > 0) {
        signStr = realStr ? " + " : "";
      } else {
        signStr = realStr ? " - " : "-";
      }

      let imStr = "";
      if (Math.abs(absIm - 1) < 1e-12) {
        imStr = "i";
      } else {
        imStr = formatFloat(absIm) + "i";
      }

      if (!realStr && !imStr) return "0";
      return realStr + signStr + imStr;
    }
  } catch (err: any) {
    return err.message || "Math ERROR";
  }
};

// Floating representation helper
export const formatFloat = (val: number): string => {
  if (Math.abs(val) < 1e-15) return "0";
  // If it's very large or small scientific notation, format nicely
  if (Math.abs(val) >= 1e12 || (Math.abs(val) > 0 && Math.abs(val) < 1e-6)) {
    return val.toExponential(8).replace(/e\+?/, "×10^");
  }
  // Standard floating format with max decimals
  const fixed = val.toFixed(10);
  const parsed = parseFloat(fixed);
  return parsed.toString();
};

// Fraction approximation using Continued Fractions (returns [numerator, denominator])
export const getFractionApproximation = (decimal: number): [number, number] | null => {
  if (Number.isNaN(decimal) || !Number.isFinite(decimal)) return null;
  if (Math.abs(decimal) < 1e-9) return [0, 1];
  if (Math.abs(decimal - Math.round(decimal)) < 1e-9) return [Math.round(decimal), 1];

  const sign = Math.sign(decimal);
  let x = Math.abs(decimal);
  const limit = 100000; // max denominator limit to avoid slow lists
  
  let m00 = 1, m01 = 0, m10 = 0, m11 = 1;

  while (m10 * Math.floor(x) + m11 <= limit) {
    const a = Math.floor(x);
    const nextM00 = m00 * a + m01;
    const nextM10 = m10 * a + m11;
    m01 = m00;
    m11 = m10;
    m00 = nextM00;
    m10 = nextM10;

    if (x === a) break; // exact
    x = 1 / (x - a);
  }

  // Double check approximation
  const approxVal = (m00 / m10) * sign;
  if (Math.abs(approxVal - decimal) < 1e-6 && m10 > 1) {
    return [m00 * sign, m10];
  }
  return null;
};


// ==========================================
// 5. BASE-N OPERATIONS EVALUATOR
// ==========================================

export const parseBaseN = (str: string, base: BaseNMode): number => {
  if (!str.trim()) return 0;
  let clean = str.replace(/\s+/g, "");
  let sign = 1;
  if (clean.startsWith("-")) {
    sign = -1;
    clean = clean.slice(1);
  }

  let radix = 10;
  if (base === "HEX") radix = 16;
  if (base === "BIN") radix = 2;
  if (base === "OCT") radix = 8;

  const parsed = parseInt(clean, radix);
  if (isNaN(parsed)) throw new Error("Math ERROR");
  return parsed * sign;
};

export const formatBaseN = (val: number, base: BaseNMode): string => {
  // Enforce integer range (32-bit signed as per standard Casio logic)
  let val32 = val >> 0;

  if (base === "DEC") return val32.toString(10);
  
  // Format unsigned representation for Hex, Bin, Oct if they are negative
  const unsignedVal = val32 >>> 0;
  if (base === "HEX") return unsignedVal.toString(16).toUpperCase();
  if (base === "OCT") return unsignedVal.toString(8);
  if (base === "BIN") {
    let binStr = unsignedVal.toString(2);
    // Casio truncates binaries or highlights standard 32 bits. Let's return clean binary
    return binStr;
  }
  return val32.toString(10);
};

export const evaluateBaseNExpression = (
  expr: string,
  base: BaseNMode
): string => {
  try {
    // Basic evaluation supporting logical: AND, OR, XOR, NOT, NAND, NOR, XNOR
    // Operators replacement for standard math JS evaluation:
    // replace symbols with bitwise standard or custom
    let clean = expr.replace(/\s+/g, "");

    // Simple evaluation loop
    // Tokenize bitwise operators
    // Note Casio logical operators: AND, OR, XOR, NOT, XNOR
    // Since we handle integer-only logical math:
    // We can parse Dec, Hex, Bin, Oct digits based on the indicators
    // To make it incredibly robust, we tokenize digits according to the set active base
    const radix = base === "DEC" ? 10 : base === "HEX" ? 16 : base === "OCT" ? 8 : 2;

    // Supported operations: +, -, *, /, AND, OR, XOR, XNOR, NOT, NAND, NOR
    // Replacing names with standard JS symbols is extremely concise
    clean = clean
      .replace(/NAND/g, " NAND ")
      .replace(/XNOR/g, " XNOR ")
      .replace(/NOR/g, " NOR ")
      .replace(/AND/g, " AND ")
      .replace(/XOR/g, " XOR ")
      .replace(/OR/g, " OR ")
      .replace(/NOT/g, " NOT ")
      .replace(/\+/g, " + ")
      .replace(/-/g, " - ")
      .replace(/\*/g, " * ")
      .replace(/\//g, " / ")
      .replace(/\(/g, " ( ")
      .replace(/\)/g, " ) ");

    const tokens = clean.trim().split(/\s+/).filter(t => t.length > 0);
    // Evaluate using a simple shunting yard / evaluation stack
    const stack: number[] = [];
    const opStack: string[] = [];
    const precedence: Record<string, number> = {
      "OR": 1, "XOR": 1, "XNOR": 1, "NOR": 1,
      "AND": 2, "NAND": 2,
      "+": 3, "-": 3,
      "*": 4, "/": 4,
      "NOT": 5
    };

    const runOp = (op: string) => {
      if (op === "NOT") {
        const val = stack.pop();
        if (val === undefined) throw new Error("Syntax ERROR");
        stack.push(~val);
        return;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("Syntax ERROR");

      switch (op) {
        case "+": stack.push((a + b) >> 0); break;
        case "-": stack.push((a - b) >> 0); break;
        case "*": stack.push((a * b) >> 0); break;
        case "/": 
          if (b === 0) throw new Error("Math ERROR: Division by Zero");
          stack.push((a / b) >> 0); 
          break;
        case "AND": stack.push(a & b); break;
        case "OR": stack.push(a | b); break;
        case "XOR": stack.push(a ^ b); break;
        case "XNOR": stack.push(~(a ^ b)); break;
        case "NAND": stack.push(~(a & b)); break;
        case "NOR": stack.push(~(a | b)); break;
      }
    };

    for (const t of tokens) {
      if (t === "(") {
        opStack.push(t);
      } else if (t === ")") {
        while (opStack.length > 0 && opStack[opStack.length - 1] !== "(") {
          runOp(opStack.pop()!);
        }
        if (opStack.length === 0) throw new Error("Syntax ERROR");
        opStack.pop(); // pop "("
      } else if (precedence[t] !== undefined) {
        while (
          opStack.length > 0 &&
          opStack[opStack.length - 1] !== "(" &&
          precedence[opStack[opStack.length - 1]] >= precedence[t]
        ) {
          runOp(opStack.pop()!);
        }
        opStack.push(t);
      } else {
        // Parse the token as base radix
        const num = parseInt(t, radix);
        if (isNaN(num)) throw new Error(`Syntax ERROR: Not a valid base-${base} number`);
        stack.push(num >> 0);
      }
    }

    while (opStack.length > 0) {
      if (opStack[opStack.length - 1] === "(") throw new Error("Syntax ERROR");
      runOp(opStack.pop()!);
    }

    if (stack.length !== 1) throw new Error("Syntax ERROR");
    return formatBaseN(stack[0], base);

  } catch (err: any) {
    return err.message || "Math ERROR";
  }
};


// ==========================================
// 6. MATRIX ARITHMETIC UTILITIES
// ==========================================

export const matrixAdd = (A: Matrix, B: Matrix): Matrix => {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Dimension ERROR: Sizes must match for addition");
  }
  return A.map((row, rIdx) => row.map((val, cIdx) => val + B[rIdx][cIdx]));
};

export const matrixSub = (A: Matrix, B: Matrix): Matrix => {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Dimension ERROR: Sizes must match for subtraction");
  }
  return A.map((row, rIdx) => row.map((val, cIdx) => val - B[rIdx][cIdx]));
};

export const matrixMul = (A: Matrix, B: Matrix): Matrix => {
  const rowsA = A.length, colsA = A[0].length;
  const rowsB = B.length, colsB = B[0].length;
  if (colsA !== rowsB) {
    throw new Error("Dimension ERROR: Columns of A must match rows of B");
  }

  const result: Matrix = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
  for (let r = 0; r < rowsA; r++) {
    for (let c = 0; c < colsB; c++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[r][k] * B[k][c];
      }
      result[r][c] = sum;
    }
  }
  return result;
};

export const matrixTranspose = (A: Matrix): Matrix => {
  const rCount = A.length, cCount = A[0].length;
  const result: Matrix = Array.from({ length: cCount }, () => Array(rCount).fill(0));
  for (let r = 0; r < rCount; r++) {
    for (let c = 0; c < cCount; c++) {
      result[c][r] = A[r][c];
    }
  }
  return result;
};

export const matrixDeterminant = (A: Matrix): number => {
  const size = A.length;
  if (size !== A[0].length) throw new Error("Matrix ERROR: Must be a square matrix for determinant");

  if (size === 1) return A[0][0];
  if (size === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  if (size === 3) {
    return (
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    );
  }

  throw new Error("Matrix ERROR: Max 3x3 matrices supported");
};

export const matrixInverse = (A: Matrix): Matrix => {
  const det = matrixDeterminant(A);
  if (det === 0) throw new Error("Matrix ERROR: Singular matrix, inverse does not exist (Det = 0)");

  const size = A.length;
  if (size === 2) {
    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det],
    ];
  }
  if (size === 3) {
    const inv: Matrix = Array.from({ length: 3 }, () => Array(3).fill(0));
    inv[0][0] = (A[1][1] * A[2][2] - A[1][2] * A[2][1]) / det;
    inv[0][1] = (A[0][2] * A[2][1] - A[0][1] * A[2][2]) / det;
    inv[0][2] = (A[0][1] * A[1][2] - A[0][2] * A[1][1]) / det;

    inv[1][0] = (A[1][2] * A[2][0] - A[1][0] * A[2][2]) / det;
    inv[1][1] = (A[0][0] * A[2][2] - A[0][2] * A[2][0]) / det;
    inv[1][2] = (A[0][2] * A[1][0] - A[0][0] * A[1][2]) / det;

    inv[2][0] = (A[1][0] * A[2][1] - A[1][1] * A[2][0]) / det;
    inv[2][1] = (A[0][1] * A[2][0] - A[0][0] * A[2][1]) / det;
    inv[2][2] = (A[0][0] * A[1][1] - A[0][1] * A[1][0]) / det;
    return inv;
  }
  throw new Error("Matrix ERROR: Max 3x3 matrices supported");
};


// ==========================================
// 7. LINEAR EQUATION & POLYNOMIAL SOLVERS
// ==========================================

// Solve Quadratic ax^2 + bx + c = 0
export const solveQuadratic = (a: number, b: number, c: number): string[] => {
  if (a === 0) {
    if (b === 0) return c === 0 ? ["All real numbers"] : ["No solution"];
    return [formatFloat(-c / b)];
  }

  const d = b * b - 4 * a * a * c; // Wait, actually d = b * b - 4*a*c, spelling mistake corrected!
  const d_correct = b * b - 4 * a * c;

  if (d_correct >= 0) {
    const r1 = (-b + Math.sqrt(d_correct)) / (2 * a);
    const r2 = (-b - Math.sqrt(d_correct)) / (2 * a);
    if (Math.abs(r1 - r2) < 1e-12) return [`x = ${formatFloat(r1)}`];
    return [`x1 = ${formatFloat(r1)}`, `x2 = ${formatFloat(r2)}`];
  } else {
    // Complex solutions
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-d_correct) / (2 * a);
    return [
      `x1 = ${formatFloat(realPart)} + ${formatFloat(imagPart)}i`,
      `x2 = ${formatFloat(realPart)} - ${formatFloat(imagPart)}i`,
    ];
  }
};

// Solve Cubic Equation: ax^3 + bx^2 + cx + d = 0
export const solveCubic = (a: number, b: number, c: number, d: number): string[] => {
  if (a === 0) return solveQuadratic(b, c, d);

  // Cardano's formulas
  const f = ((3 * c / a) - ((b * b) / (a * a))) / 3;
  const g = (((2 * b * b * b) / (a * a * a)) - ((9 * b * c) / (a * a)) + (27 * d / a)) / 27;
  const hTerm = ((g * g) / 4) + ((f * f * f) / 27);

  if (hTerm > 0) {
    const R_val = -(g / 2) + Math.sqrt(hTerm);
    const S = Math.cbrt(R_val);
    const T_val = -(g / 2) - Math.sqrt(hTerm);
    const UVal = Math.cbrt(T_val);

    const x1 = (S + UVal) - (b / (3 * a));
    // Complex conjugates
    const realPart = -((S + UVal) / 2) - (b / (3 * a));
    const imagPart = ((S - UVal) * Math.sqrt(3)) / 2;

    return [
      `x1 = ${formatFloat(x1)}`,
      `x2 = ${formatFloat(realPart)} + ${formatFloat(imagPart)}i`,
      `x3 = ${formatFloat(realPart)} - ${formatFloat(imagPart)}i`,
    ];
  } else if (f === 0 && g === 0 && hTerm === 0) {
    const x = -Math.cbrt(d / a);
    return [`x = ${formatFloat(x)} (triple root)`];
  } else {
    // 3 real roots
    const iFactor = Math.sqrt(((g * g) / 4) - hTerm);
    const jRC = Math.cbrt(iFactor);
    const kRC = Math.acos(-(g / (2 * iFactor)));
    const mFactor = Math.cos(kRC / 3);
    const nFactor = Math.sqrt(3) * Math.sin(kRC / 3);
    const pFactor = -(b / (3 * a));

    const x1 = 2 * jRC * mFactor + pFactor;
    const x2 = -jRC * (mFactor + nFactor) + pFactor;
    const x3 = -jRC * (mFactor - nFactor) + pFactor;

    return [
      `x1 = ${formatFloat(x1)}`,
      `x2 = ${formatFloat(x2)}`,
      `x3 = ${formatFloat(x3)}`,
    ];
  }
};

// Solve Simultaneous 2 Variables system:
// a1 x + b1 y = c1
// a2 x + b2 y = c2
export const solveSimul2 = (coefs: number[]): string[] => {
  const [a1, b1, c1, a2, b2, c2] = coefs;
  const det = a1 * b2 - b1 * a2;
  if (det === 0) {
    if (a1 / a2 === c1 / c2) return ["Infinite Solutions"];
    return ["No Solution"];
  }
  const x = (c1 * b2 - b1 * c2) / det;
  const y = (a1 * c2 - c1 * a2) / det;
  return [`x = ${formatFloat(x)}`, `y = ${formatFloat(y)}`];
};

// Solve Simultaneous 3 Variables system:
// a1 x + b1 y + c1 z = d1
// etc.
export const solveSimul3 = (coefs: number[]): string[] => {
  const [
    a1, b1, c1, d1,
    a2, b2, c2, d2,
    a3, b3, c3, d3
  ] = coefs;

  const det =
    a1 * (b2 * c3 - c2 * b3) -
    b1 * (a2 * c3 - c2 * a3) +
    c1 * (a2 * b3 - b2 * a3);

  if (det === 0) {
    return ["No Solution or Infinite Solutions"];
  }

  const detX =
    d1 * (b2 * c3 - c2 * b3) -
    b1 * (d2 * c3 - c2 * d3) +
    c1 * (d2 * b3 - b2 * d3);

  const detY =
    a1 * (d2 * c3 - c2 * d3) -
    d1 * (a2 * c3 - c2 * a3) +
    c1 * (a2 * d3 - d2 * a3);

  const detZ =
    a1 * (b2 * d3 - d2 * b3) -
    b1 * (a2 * d3 - d2 * a3) +
    d1 * (a2 * b3 - b2 * a3);

  const x = detX / det;
  const y = detY / det;
  const z = detZ / det;

  return [
    `x = ${formatFloat(x)}`,
    `y = ${formatFloat(y)}`,
    `z = ${formatFloat(z)}`,
  ];
};


// ==========================================
// 8. UNIT CONVERTERS DATABASE & RUNNER
// ==========================================

import { UnitCategory } from "../types";

export const UNIT_CONVERSION_CATEGORIES: UnitCategory[] = [
  {
    name: "Length",
    units: [
      { name: "Meter", symbol: "m", factor: 1 },
      { name: "Kilometer", symbol: "km", factor: 1000 },
      { name: "Centimeter", symbol: "cm", factor: 0.01 },
      { name: "Millimeter", symbol: "mm", factor: 0.001 },
      { name: "Inch", symbol: "in", factor: 0.0254 },
      { name: "Foot", symbol: "ft", factor: 0.3048 },
      { name: "Yard", symbol: "yd", factor: 0.9144 },
      { name: "Mile", symbol: "mi", factor: 1609.344 },
    ],
  },
  {
    name: "Mass",
    units: [
      { name: "Kilogram", symbol: "kg", factor: 1 },
      { name: "Gram", symbol: "g", factor: 0.001 },
      { name: "Pound", symbol: "lb", factor: 0.45359237 },
      { name: "Ounce", symbol: "oz", factor: 0.028349523125 },
    ],
  },
  {
    name: "Temperature",
    units: [
      { name: "Celsius", symbol: "°C", factor: 1, offset: 0 },
      { name: "Fahrenheit", symbol: "°F", factor: 5 / 9, offset: -32 },
      { name: "Kelvin", symbol: "K", factor: 1, offset: -273.15 },
    ],
  },
  {
    name: "Area",
    units: [
      { name: "Square Meter", symbol: "m²", factor: 1 },
      { name: "Square Kilometer", symbol: "km²", factor: 1000000 },
      { name: "Hectare", symbol: "ha", factor: 10000 },
      { name: "Acre", symbol: "ac", factor: 4046.85642 },
      { name: "Square Foot", symbol: "ft²", factor: 0.092903 },
    ],
  },
  {
    name: "Volume",
    units: [
      { name: "Liter", symbol: "L", factor: 0.001 },
      { name: "Milliliter", symbol: "mL", factor: 0.000001 },
      { name: "Cubic Meter", symbol: "m³", factor: 1 },
      { name: "Gallon (US)", symbol: "gal", factor: 0.00378541 },
    ],
  },
  {
    name: "Speed",
    units: [
      { name: "Meters per second", symbol: "m/s", factor: 1 },
      { name: "Kilometers per hour", symbol: "km/h", factor: 1 / 3.6 },
      { name: "Miles per hour", symbol: "mph", factor: 0.44704 },
      { name: "Knot", symbol: "kt", factor: 0.514444 },
    ],
  },
  {
    name: "Energy",
    units: [
      { name: "Joule", symbol: "J", factor: 1 },
      { name: "Kilojoule", symbol: "kJ", factor: 1000 },
      { name: "Calorie", symbol: "cal", factor: 4.184 },
      { name: "Kilocalorie", symbol: "kcal", factor: 4184 },
      { name: "Watt-hour", symbol: "Wh", factor: 3600 },
      { name: "Kilowatt-hour", symbol: "kWh", factor: 3600000 },
    ],
  },
];

export const convertUnits = (
  catIdx: number,
  fromIdx: number,
  toIdx: number,
  valStr: string
): number | null => {
  const num = parseFloat(valStr);
  if (isNaN(num)) return null;

  const category = UNIT_CONVERSION_CATEGORIES[catIdx];
  const fromUnit = category.units[fromIdx];
  const toUnit = category.units[toIdx];

  if (category.name === "Temperature") {
    // Temperature handles offset calculations directly
    // First, convert input to Celsius
    const cVal = (num + (fromUnit.offset || 0)) * fromUnit.factor;
    // Second, convert Celsius to destination unit
    const destVal = cVal / toUnit.factor - (toUnit.offset || 0);
    return destVal;
  } else {
    // Standard scaling factors
    const baseValue = num * fromUnit.factor;
    return baseValue / toUnit.factor;
  }
};
