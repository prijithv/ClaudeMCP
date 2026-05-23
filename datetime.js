import { z } from "zod";

/**
 * Date & Time Tools
 * ──────────────────
 * Current time, date arithmetic, timezone conversion, countdowns.
 */
export function registerDateTimeTools(server) {
  server.tool(
    "get_current_time",
    "Get the current date and time in a specified timezone.",
    {
      timezone: z
        .string()
        .default("UTC")
        .describe('IANA timezone (e.g. "America/New_York", "Europe/London", "Asia/Tokyo")'),
      format: z
        .enum(["iso", "human", "date_only", "time_only"])
        .default("human")
        .describe("Output format"),
    },
    { readOnlyHint: true },
    async ({ timezone, format }) => {
      let date;
      try {
        date = new Date().toLocaleString("en-US", { timeZone: timezone });
      } catch {
        return {
          content: [{ type: "text", text: `Invalid timezone: "${timezone}"` }],
          isError: true,
        };
      }

      const now = new Date(date);
      let output;
      switch (format) {
        case "iso":       output = new Date().toISOString(); break;
        case "date_only": output = now.toLocaleDateString("en-US", { timeZone: timezone, dateStyle: "full" }); break;
        case "time_only": output = now.toLocaleTimeString("en-US", { timeZone: timezone }); break;
        default:          output = `${now.toLocaleDateString("en-US", { dateStyle: "full" })} at ${now.toLocaleTimeString("en-US")}`; break;
      }

      return { content: [{ type: "text", text: `🕐 ${output} (${timezone})` }] };
    }
  );

  server.tool(
    "date_difference",
    "Calculate the number of days, weeks, or months between two dates.",
    {
      from: z.string().describe("Start date in YYYY-MM-DD format"),
      to: z.string().describe("End date in YYYY-MM-DD format"),
      unit: z.enum(["days", "weeks", "months"]).default("days").describe("Unit of measurement"),
    },
    { readOnlyHint: true },
    async ({ from, to, unit }) => {
      const d1 = new Date(from);
      const d2 = new Date(to);
      if (isNaN(d1) || isNaN(d2)) {
        return { content: [{ type: "text", text: "Invalid date format. Use YYYY-MM-DD." }], isError: true };
      }

      const msPerDay = 1000 * 60 * 60 * 24;
      const diffMs   = Math.abs(d2 - d1);
      const diffDays = Math.floor(diffMs / msPerDay);
      let result;

      switch (unit) {
        case "days":   result = `${diffDays} day${diffDays !== 1 ? "s" : ""}`; break;
        case "weeks":  result = `${(diffDays / 7).toFixed(1)} weeks`; break;
        case "months": result = `${(diffDays / 30.44).toFixed(1)} months`; break;
      }

      const label = d2 >= d1 ? "after" : "before";
      return { content: [{ type: "text", text: `${to} is ${result} ${label} ${from}` }] };
    }
  );

  server.tool(
    "add_days_to_date",
    "Add or subtract days from a date to find a new date.",
    {
      date: z.string().describe("Starting date in YYYY-MM-DD format"),
      days: z.number().int().describe("Number of days to add (negative to subtract)"),
    },
    { readOnlyHint: true },
    async ({ date, days }) => {
      const d = new Date(date);
      if (isNaN(d)) {
        return { content: [{ type: "text", text: "Invalid date. Use YYYY-MM-DD." }], isError: true };
      }
      d.setDate(d.getDate() + days);
      const result = d.toISOString().slice(0, 10);
      const label  = days >= 0 ? `+${days}` : `${days}`;
      return { content: [{ type: "text", text: `${date} ${label} days = ${result}` }] };
    }
  );
}
