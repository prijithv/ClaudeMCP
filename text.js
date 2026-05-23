import { z } from "zod";

/**
 * Text Tools
 * ───────────
 * Word count, character count, reverse, case transform, etc.
 */
export function registerTextTools(server) {
  server.tool(
    "text_stats",
    "Get statistics about a piece of text: word count, character count, sentence count, and reading time.",
    {
      text: z.string().min(1).describe("The text to analyze"),
    },
    { readOnlyHint: true },
    async ({ text }) => {
      const words      = text.trim().split(/\s+/).filter(Boolean).length;
      const chars      = text.length;
      const charsNoSp  = text.replace(/\s/g, "").length;
      const sentences  = (text.match(/[.!?]+/g) ?? []).length;
      const readingMin = Math.ceil(words / 200);

      return {
        content: [
          {
            type: "text",
            text: [
              `📊 Text Statistics`,
              `─────────────────`,
              `Words:            ${words}`,
              `Characters:       ${chars}`,
              `Chars (no spaces):${charsNoSp}`,
              `Sentences:        ${sentences}`,
              `Reading time:     ~${readingMin} min`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  server.tool(
    "transform_text",
    "Transform text: uppercase, lowercase, title case, reverse, or remove extra spaces.",
    {
      text: z.string().min(1).describe("The text to transform"),
      transform: z
        .enum(["uppercase", "lowercase", "titlecase", "reverse", "trim"])
        .describe("The transformation to apply"),
    },
    { readOnlyHint: true },
    async ({ text, transform }) => {
      let result;
      switch (transform) {
        case "uppercase":  result = text.toUpperCase(); break;
        case "lowercase":  result = text.toLowerCase(); break;
        case "titlecase":  result = text.replace(/\b\w/g, c => c.toUpperCase()); break;
        case "reverse":    result = text.split("").reverse().join(""); break;
        case "trim":       result = text.replace(/\s+/g, " ").trim(); break;
      }
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "count_occurrences",
    "Count how many times a word or phrase appears in a text.",
    {
      text: z.string().min(1).describe("The text to search in"),
      search: z.string().min(1).describe("The word or phrase to count"),
      case_sensitive: z.boolean().default(false).describe("Whether to match case exactly"),
    },
    { readOnlyHint: true },
    async ({ text, search, case_sensitive }) => {
      const haystack = case_sensitive ? text : text.toLowerCase();
      const needle   = case_sensitive ? search : search.toLowerCase();
      const count    = haystack.split(needle).length - 1;
      return {
        content: [
          {
            type: "text",
            text: `"${search}" appears ${count} time${count !== 1 ? "s" : ""} in the text.`,
          },
        ],
      };
    }
  );
}
