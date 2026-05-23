# 🔌 My Claude MCP Connector

A ready-to-deploy MCP server that adds custom tools to Claude for **free**.

## ✨ Included Tools

| Tool | Description |
|---|---|
| `calculate` | Add, subtract, multiply, divide two numbers |
| `percentage` | Find X% of Y, or what % X is of Y |
| `text_stats` | Word count, char count, reading time |
| `transform_text` | UPPER/lower/Title/reverse/trim |
| `count_occurrences` | Count a word in text |
| `get_current_time` | Current time in any timezone |
| `date_difference` | Days/weeks/months between dates |
| `add_days_to_date` | Add or subtract days from a date |
| `get_weather` | Current weather for any city (free API, no key!) |
| `get_forecast` | 7-day forecast for any city (free API!) |

---

## 🚀 Deploy for Free (3 options)

### Option 1: Render (Recommended — easiest)

1. Push this folder to a **GitHub repository**.
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect your GitHub repo.
4. Render auto-detects `render.yaml`. Click **Deploy**.
5. Your URL will be: `https://my-claude-mcp-connector.onrender.com`

> ⚠️ Free Render services sleep after 15 min of inactivity. First request may be slow.

---

### Option 2: Railway

1. Push to GitHub.
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
3. Railway reads `railway.json` automatically.
4. Your URL will be in the Railway dashboard.

---

### Option 3: Glitch

1. Go to [glitch.com](https://glitch.com) → New Project → Import from GitHub.
2. Paste your repo URL.
3. Glitch provides `https://your-project.glitch.me` instantly.

---

## ➕ Add to Claude

1. Open [claude.ai](https://claude.ai)
2. Go to **Settings → Connectors → + Add custom connector**
3. Paste your deployed URL + `/mcp`:
   ```
   https://YOUR-APP-URL.onrender.com/mcp
   ```
4. Click **Add**. Your tools are now available to Claude! 🎉

> 📝 Free Claude accounts can add **1 custom connector**. Pro/Max can add multiple.

---

## 🛠️ Add Your Own Tools

1. Copy `src/tools/_template.js` → rename it (e.g. `src/tools/my_api.js`)
2. Define your tools using the template pattern
3. In `src/index.js`, add:
   ```js
   import { registerMyTools } from "./tools/my_api.js";
   // inside createMcpServer():
   registerMyTools(server);
   ```
4. Redeploy → tools appear in Claude automatically

### Tool Anatomy

```js
server.tool(
  "tool_name",              // snake_case name
  "What this tool does",    // Description Claude uses to pick the tool
  {
    input: z.string().describe("What this input is"),  // Zod schema
  },
  { readOnlyHint: true },   // ← REQUIRED annotation (or destructiveHint: true)
  async ({ input }) => {
    // Your logic here
    return { content: [{ type: "text", text: "Your result" }] };
  }
);
```

### Annotation Rules (Required!)

| Annotation | When to use |
|---|---|
| `{ readOnlyHint: true }` | Tool only reads data, no side effects |
| `{ destructiveHint: true }` | Tool deletes or modifies data |
| `{ readOnlyHint: false }` | Tool writes/creates data (non-destructive) |

---

## 🔑 Adding Authentication (Optional)

If you want to protect your connector with OAuth:

1. Set up an OAuth provider (e.g. Auth0 free tier, GitHub OAuth App)
2. Add `OAuth Client ID` and `OAuth Client Secret` in Claude's connector settings
3. Implement the OAuth flow in your server

---

## 📋 Requirements (Claude MCP spec)

- ✅ **Transport**: Streamable HTTP (SSE deprecated March 2025)
- ✅ **HTTPS**: Server must be publicly accessible over HTTPS
- ✅ **Annotations**: Every tool has `readOnlyHint` or `destructiveHint`
- ✅ **Token limit**: Tool results < 25,000 tokens
- ✅ **Timeout**: Handlers complete within 5 minutes

---

## 🏃 Run Locally

```bash
npm install
npm start
# Server at http://localhost:3000
# Add http://localhost:3000/mcp to Claude Desktop
```

For Claude Desktop local testing, add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "my-connector": {
      "command": "node",
      "args": ["/path/to/mcp-connector/src/index.js"]
    }
  }
}
```
