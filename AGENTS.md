# Pi Agent Web - Development Notes

## Quick Start

```bash
npm run dev   # port 30141
```

Typecheck: `node_modules/.bin/tsc --noEmit`  
Lint: `npm run lint`  
**Never run `next build` during dev** — pollutes `.next/` and breaks `npm run dev`.

---

## Hard Constraints

- Do not batch-delete files or directories. Never use recursive delete, glob delete, `find ... -delete`, `find ... -exec rm ...`, `xargs rm`, or equivalent bulk deletion commands.
- If a file must be deleted, confirm it is one explicit ordinary file path and delete only that one file. Do not delete directories.
- Keep documentation in sync with behavior. Any feature, route, script, packaging, workflow, or user-visible behavior change must update both `AGENTS.md` and the relevant README markdown in the same change.
- Treat session files as user data. Prefer read-only inspection unless the route or feature explicitly owns the write, such as rename, delete/reparent, compact, fork, or skill/model config edits.
- Do not revert unrelated worktree changes. This repo may have local changes in progress.

---

## Architecture

```
Browser                Next.js Server              AgentSession (in-process)
  │                        │                               │
  ├─ GET /api/sessions ────▶ reads ~/.pi/agent/sessions/   │
  ├─ GET /api/sessions/[id] reads .jsonl file directly     │
  │                        │                               │
  ├─ send / steer / follow ▶ POST /api/agent/[id]          │
  │                        │   startRpcSession() ─────────▶│ createAgentSession()
  │                        │   session.send(cmd) ─────────▶│ session.prompt()
  │                        │                               │
  ├─ SSE connect ──────────▶ GET /api/agent/[id]/events    │
  │                        │   session.onEvent() ◀─────────│ session.subscribe()
  │◀── data: {...} ─────────│                               │
```

**Session browsing** (read-only): reads `.jsonl` files directly via `lib/session-reader.ts` — no AgentSession created.  
**Sending a message**: `startRpcSession()` in `lib/rpc-manager.ts` creates an AgentSession in-process.

---

## File Map

```
app/api/
  sessions/route.ts               GET  list all sessions
  sessions/[id]/route.ts          GET/PATCH/DELETE session
  sessions/[id]/context/route.ts  GET ?leafId= — context for a specific leaf
  sessions/new/route.ts           returns 410 (no longer used)
  agent/new/route.ts              POST { cwd, message, toolNames?, provider?, modelId? }
  agent/[id]/route.ts             GET state | POST any command
  agent/[id]/events/route.ts      GET SSE stream
  files/[...path]/route.ts        GET file contents for viewer
  home/route.ts                   GET user home directory
  default-cwd/route.ts            POST create ~/pi-cwd-YYYYMMDD
  models/route.ts                 GET { models, modelList, defaultModel }
  models-config/route.ts          GET/POST — read/write ~/.pi/agent/models.json
  skills/route.ts                 GET skills for cwd | PATCH disable-model-invocation
  skills/search/route.ts          POST search skills.sh; falls back to npx skills find
  skills/install/route.ts         POST npx skills add, global or project scope
  auth/providers/route.ts         GET OAuth provider login state
  auth/all-providers/route.ts     GET API-key provider configuration state
  auth/login/[provider]/route.ts  POST start OAuth flow
  auth/logout/[provider]/route.ts POST remove provider auth
  auth/api-key/[provider]/route.ts GET/POST/DELETE provider API key

lib/
  rpc-manager.ts      AgentSessionWrapper + registry + startRpcSession
  session-reader.ts   SessionManager-backed listing/context; path cache
  agent-client.ts     typed client helpers for agent/session routes
  file-paths.ts       cross-platform file path display/API encoding helpers
  npx.ts              shell-free cross-platform npx wrapper
  types.ts            shared TypeScript types
  pi-types.ts         local AgentSession/tool type shims
  normalize.ts        normalizeToolCalls() — field name mismatch between file format and our types

components/
  AppShell.tsx        layout + URL state + tab management
  SessionSidebar.tsx  session tree + FileExplorer
  ChatWindow.tsx      messages + streaming + SSE + fork/navigate logic
  ChatInput.tsx       input bar + model/thinking/tools/compact controls
  MessageView.tsx     renders one message (user/assistant/toolCall/toolResult)
  BranchNavigator.tsx in-session branch switcher
  ChatMinimap.tsx     scroll minimap alongside the message list
  ToolPanel.tsx       exports PRESET_NONE/DEFAULT/FULL + getPresetFromTools
  ModelsConfig.tsx    modal for editing models.json (opened from sidebar bottom)
  SkillsConfig.tsx    modal for listing/searching/installing/toggling skills
  FileExplorer.tsx    file tree inside sidebar
  FileIcons.tsx       extension-aware file/folder icons
  FileViewer.tsx      file content in a tab
  TabBar.tsx          tab bar (Chat + open file tabs)

hooks/
  useAgentSession.ts  agent/session request helper hook
  useAudio.ts         done sound state + Web Audio playback
  useDragDrop.ts      image drag/drop plumbing
  useTheme.ts         light/dark theme with view-transition animation

bin/
  pi-web.js           packaged CLI wrapper around next start

scripts/
  dev.js              starts next dev --webpack on port 30141; re-execs out of Codex bundled Node when possible
  prepare-desktop.js  copies standalone Next output for Electron packaging
  start-desktop.js    starts Electron with PI_WEB_ELECTRON_MODE=production

electron/
  main.js             Electron shell; starts packaged Next server or attaches to dev server
  runtime.js          runtime path/mode helpers
  runtime.test.js     runtime helper tests
```

---

## Key Design Decisions & Traps

### AgentSession lifecycle (`lib/rpc-manager.ts`)
- One `AgentSessionWrapper` per session id, keyed in `globalThis.__piSessions`
- `globalThis` survives Next.js hot-reload; plain module-level Map does not
- Idle timeout: 10 minutes. Concurrent `startRpcSession()` calls share a single start Promise (`globalThis.__piStartLocks`)
- New sessions are created with `SessionManager.create(cwd)` and then cached under pi's real session id after startup.
- `get_state` also exposes streaming/compaction/retry state, active model, context usage, system prompt, and thinking level.

### Fork must destroy the wrapper immediately
`AgentSession.fork()` **mutates the wrapper's inner state in-place** — after fork, `inner.sessionId` is the *new* session's id. If the wrapper stays alive in the registry under the old id, the next request gets the already-forked state and subsequent forks produce a corrupt `parentSession` chain.

**Fix**: `send("fork")` captures `newSessionId`, then calls `this.destroy()` before returning. The next request for the original session reloads a clean AgentSession from the original file.

### Two kinds of branching — don't confuse them
- **Fork** (Fork button on user message): creates a new independent `.jsonl` file. Shown as a child in the sidebar tree via `parentSession` header field.
- **In-session branch** (Continue button / BranchNavigator): calls `navigate_tree` within the same file. Multiple entries share the same `parentId`. Switching between them calls `/api/sessions/[id]/context?leafId=`.

### Session files can be fully rewritten
`parentSession` in the header is **display metadata only** — has zero effect on chat content. Safe to `writeFileSync` the entire file (pi does this itself during migrations). Used when cascade-reparenting children on delete.

### ToolCall field normalization
Pi stores toolCall blocks as `{type:"toolCall", id, name, arguments}` but `ToolCallContent` uses `{toolCallId, toolName, input}`. `normalizeToolCalls()` in `lib/normalize.ts` handles this — called in both `session-reader.ts` (file load) and `ChatWindow.handleAgentEvent()` (streaming).

### New session tool preset
Tool names are passed at session creation (`POST /api/agent/new` → `toolNames[]`). For existing sessions, the active preset is inferred on mount via `get_tools` → `getPresetFromTools()`.

Current behavior: `startRpcSession()` passes all built-in coding tool names by default, narrows with `inner.setActiveToolsByName(toolNames)` for specific presets, and clears `inner.agent.state.systemPrompt` when tools are disabled so the System panel can accurately show an empty prompt.

### Model defaults for new sessions
`GET /api/models` returns `defaultModel` read from `~/.pi/agent/settings.json`. `ChatWindow` pre-selects this on mount for new sessions.

### SSE reconnect on page refresh mid-stream
On `ChatWindow` mount, `GET /api/agent/[id]` is called. If `state.isStreaming === true`, SSE is reconnected automatically. `thinkingLevel` and `isCompacting` are also synced from this response.

### Compaction SSE events
Newer pi emits `compaction_start` / `compaction_end`; older versions emitted `auto_compaction_start` / `auto_compaction_end`. `handleAgentEvent` accepts both sets to keep `isCompacting` in sync. Manual compact is a blocking POST — the button stays disabled until the response returns.

### Session listing
Session listing is delegated to `SessionManager.listAll()`. The app maps pi session paths to ids, fills `globalThis.__piSessionPathCache`, and resolves `parentSessionId` from `parentSessionPath`.

### Delete semantics
`DELETE /api/sessions/[id]` deletes only the resolved `.jsonl` file with `unlinkSync(filePath)`. Before unlinking it scans sibling session files and rewrites direct children so their `parentSession` points at the deleted session's parent. Do not replace this with directory or glob deletion.

### Skills management
`SkillsConfig` loads skills through `DefaultResourceLoader`, matching AgentSession startup behavior. Toggling visibility edits only the `disable-model-invocation` frontmatter key in the target `SKILL.md`. Installing skills uses `runNpx(["skills", "add", ...])` without a shell; search prefers `skills.sh` and falls back to `npx skills find`.

### Auth and models
OAuth state comes from `AuthStorage` via `/api/auth/providers`. API-key provider state comes from `ModelRegistry` via `/api/auth/all-providers`, excluding OAuth-only providers and custom `models.json` keys. `ModelsConfig` edits the agent data dir `models.json`.

### Images, steering, follow-ups, and audio
`ChatInput` supports pasted/attached images, sends them as base64 image blocks, and can queue `steer` or `follow_up` while streaming. `useAudio()` stores `pi-sound-enabled` in localStorage and plays a short Web Audio completion sound.

### Desktop packaging
`next.config.ts` uses `output: "standalone"` and externalizes pi packages. Packaged Electron starts the standalone Next server on a random localhost port; development Electron expects the Next dev server to already be running. `npm run desktop:start` forces production runtime via `scripts/start-desktop.js`, so it requires a prior build/prepare output.

---

## Pi Session File Format

Location: `~/.pi/agent/sessions/<encoded-cwd>/<timestamp>_<uuid>.jsonl`

```jsonl
{"type":"session","version":3,"id":"<uuid>","timestamp":"...","cwd":"/path","parentSession":"/abs/path/to/parent.jsonl"}
{"type":"model_change","id":"<8hex>","parentId":null,"provider":"zenmux","modelId":"claude-sonnet-4-6","timestamp":"..."}
{"type":"message","id":"<8hex>","parentId":"<8hex>","message":{"role":"user","content":"..."}}
{"type":"message","id":"<8hex>","parentId":"<8hex>","message":{"role":"assistant","content":[...],...}}
{"type":"message","id":"<8hex>","parentId":"<8hex>","message":{"role":"toolResult","toolCallId":"...","content":[...]}}
{"type":"compaction","id":"<8hex>","parentId":"<8hex>","summary":"...","firstKeptEntryId":"<8hex>","tokensBefore":N}
{"type":"session_info","id":"...","parentId":"...","name":"user-defined name"}
```

`entryIds[]` in `SessionContext` is a parallel array to `messages[]` — maps each displayed message back to its `.jsonl` entry id, used for fork and navigate_tree calls.

---

## CSS Variables (`app/globals.css`)

```
--bg --bg-panel --bg-hover --bg-selected --border
--text --text-muted --text-dim
--accent --user-bg --tool-bg
--font-mono
```
