/**
 * ════════════════════════════════════════════════
 *  ADD YOUR OWN TOOL — TEMPLATE
 *  Copy this file, rename it, and register it in
 *  src/index.js to add new tools to your connector.
 * ════════════════════════════════════════════════
 *
 *  Usage:
 *  1. Copy this file to src/tools/my_tool.js
 *  2. In src/index.js, add:
 *       import { registerMyTools } from "./tools/my_tool.js";
 *     and inside createMcpServer():
 *       registerMyTools(server);
 *  3. Redeploy your server.
 */

import { z } from "zod";

export function registerMyTools(server) {

  // ─────────────────────────────────────────────────────────
  //  EXAMPLE: a simple "hello" tool
  // ─────────────────────────────────────────────────────────
  server.tool(
    // Tool name (snake_case, no spaces)
    "hello_world",

    // Description — be specific! Claude uses this to decide when to call it.
    "Say hello to a person by name and return a friendly greeting.",

    // Input schema using Zod
    {
      name: z.string().min(1).describe("The person's name to greet"),
      language: z
        .enum(["english", "spanish", "french", "german", "japanese"])
        .default("english")
        .describe("The language for the greeting"),
    },

    // ⚠️  REQUIRED: annotations object
    // Use readOnlyHint: true  for tools that don't change any data
    // Use destructiveHint: true for tools that delete or modify data
    { readOnlyHint: true },

    // Handler function — must return { content: [...] }
    async ({ name, language }) => {
      const greetings = {
        english:  `Hello, ${name}! 👋`,
        spanish:  `¡Hola, ${name}! 👋`,
        french:   `Bonjour, ${name}! 👋`,
        german:   `Hallo, ${name}! 👋`,
        japanese: `こんにちは、${name}さん！ 👋`,
      };

      return {
        content: [{ type: "text", text: greetings[language] }],
      };
    }
  );


  // ─────────────────────────────────────────────────────────
  //  EXAMPLE: call an external API
  // ─────────────────────────────────────────────────────────
  server.tool(
    "get_random_joke",
    "Fetch a random programming joke from the free JokeAPI.",
    {},                       // No inputs needed
    { readOnlyHint: true },
    async () => {
      const res  = await fetch("https://v2.jokeapi.dev/joke/Programming?type=single");
      const data = await res.json();

      if (data.error) {
        return { content: [{ type: "text", text: "Could not fetch a joke right now." }], isError: true };
      }

      return { content: [{ type: "text", text: `😄 ${data.joke}` }] };
    }
  );


  // ─────────────────────────────────────────────────────────
  //  EXAMPLE: destructive tool (modifies/deletes data)
  // ─────────────────────────────────────────────────────────
  server.tool(
    "example_destructive",
    "Example of a tool that modifies data. Uses destructiveHint annotation.",
    {
      item_id: z.string().describe("ID of the item to delete"),
    },
    { destructiveHint: true },   // ← Use this for write/delete operations
    async ({ item_id }) => {
      // Your delete logic here
      return { content: [{ type: "text", text: `Deleted item: ${item_id}` }] };
    }
  );

}
