import { z } from "zod";

/**
 * Calculator Tools
 * ─────────────────
 * Add, subtract, multiply, divide, and evaluate expressions.
 */
export function registerCalculatorTools(server) {
  // Basic arithmetic
  server.tool(
    "calculate",
    "Perform basic arithmetic: add, subtract, multiply, or divide two numbers.",
    {
      operation: z
        .enum(["add", "subtract", "multiply", "divide"])
        .describe("The arithmetic operation to perform"),
      a: z.number().describe("The first number"),
      b: z.number().describe("The second number"),
    },
    { readOnlyHint: true }, // ← Required annotation
    async ({ operation, a, b }) => {
      let result;
      switch (operation) {
        case "add":      result = a + b; break;
        case "subtract": result = a - b; break;
        case "multiply": result = a * b; break;
        case "divide":
          if (b === 0) {
            return { content: [{ type: "text", text: "Error: Division by zero" }], isError: true };
          }
          result = a / b;
          break;
      }
      return {
        content: [{ type: "text", text: `${a} ${operation} ${b} = ${result}` }],
      };
    }
  );

  // Percentage calculator
  server.tool(
    "percentage",
    "Calculate what percentage X is of Y, or find X% of Y.",
    {
      mode: z
        .enum(["of", "is_what_percent"])
        .describe('"of" → find X% of Y.  "is_what_percent" → what % is X of Y'),
      x: z.number().describe("The first value"),
      y: z.number().describe("The second value"),
    },
    { readOnlyHint: true },
    async ({ mode, x, y }) => {
      if (mode === "of") {
        const result = (x / 100) * y;
        return { content: [{ type: "text", text: `${x}% of ${y} = ${result}` }] };
      } else {
        if (y === 0) return { content: [{ type: "text", text: "Error: Denominator is zero" }], isError: true };
        const result = (x / y) * 100;
        return { content: [{ type: "text", text: `${x} is ${result.toFixed(4)}% of ${y}` }] };
      }
    }
  );
}
