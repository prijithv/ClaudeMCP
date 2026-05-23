/**
 * ============================================================
 *  MY CLAUDE MCP CONNECTOR
 *  ─────────────────────────────────────────────────────────
 *  A ready-to-deploy MCP server using Streamable HTTP transport.
 *  Deploy for FREE on Railway, Render, or Glitch, then add it
 *  to Claude via Settings → Connectors → Add custom connector.
 * ============================================================
 */

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";

// ──────────────────────────────────────────────
//  Import your custom tools here
// ──────────────────────────────────────────────
import { registerCalculatorTools } from "./tools/calculator.js";
import { registerTextTools } from "./tools/text.js";
import { registerDateTimeTools } from "./tools/datetime.js";
import { registerWeatherTools } from "./tools/weather.js";

// ──────────────────────────────────────────────
//  Config
// ──────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
const SERVER_NAME = process.env.SERVER_NAME ?? "my-claude-connector";
const SERVER_VERSION = "1.0.0";

// Sessions map: sessionId → transport
const sessions = new Map();

// ──────────────────────────────────────────────
//  Factory: create a fresh McpServer per session
// ──────────────────────────────────────────────
function createMcpServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // ── Register all tool groups ──────────────────
  registerCalculatorTools(server);
  registerTextTools(server);
  registerDateTimeTools(server);
  registerWeatherTools(server);

  // ── Add YOUR custom tools here ────────────────
  // Example:
  //   server.tool(
  //     "my_tool",
  //     "Description of what this tool does",
  //     { input: z.string().describe("The input") },
  //     { readOnlyHint: true },          // ← REQUIRED annotation
  //     async ({ input }) => {
  //       return { content: [{ type: "text", text: `Result: ${input}` }] };
  //     }
  //   );

  return server;
}

// ──────────────────────────────────────────────
//  Express app
// ──────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health check (Render / Railway / Glitch need this)
app.get("/", (_req, res) => {
  res.json({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    status: "running",
    transport: "Streamable HTTP",
    endpoint: "/mcp",
  });
});

// ──────────────────────────────────────────────
//  POST /mcp  – handle new requests / messages
// ──────────────────────────────────────────────
app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  let transport;

  if (sessionId && sessions.has(sessionId)) {
    // Existing session
    transport = sessions.get(sessionId);
  } else {
    // New session
    const newSessionId = randomUUID();
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => newSessionId,
      onsessioninitialized: (id) => {
        sessions.set(id, transport);
        console.log(`[MCP] Session started: ${id}`);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        sessions.delete(transport.sessionId);
        console.log(`[MCP] Session ended: ${transport.sessionId}`);
      }
    };

    const server = createMcpServer();
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

// ──────────────────────────────────────────────
//  GET /mcp  – SSE stream for server-sent events
// ──────────────────────────────────────────────
app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }

  const transport = sessions.get(sessionId);
  await transport.handleRequest(req, res);
});

// ──────────────────────────────────────────────
//  DELETE /mcp  – close a session
// ──────────────────────────────────────────────
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (sessionId && sessions.has(sessionId)) {
    const transport = sessions.get(sessionId);
    await transport.handleRequest(req, res);
    sessions.delete(sessionId);
    console.log(`[MCP] Session deleted: ${sessionId}`);
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// ──────────────────────────────────────────────
//  Start
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  MCP Connector running on port ${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`   Health:   http://localhost:${PORT}/\n`);
});
