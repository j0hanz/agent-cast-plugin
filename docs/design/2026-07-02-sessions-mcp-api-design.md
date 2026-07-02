# Sessions — MCP API reference

Source: extends `web/src/data/types.ts` (`SessionQuestion`/`SessionField`)
and `web/src/data/sessionSchema.ts`, built 2026-07-02 as UI-only (see the
`SESSIONS` comment in `web/src/data/live.ts`). This is the contract a
Sessions MCP server (to live under `mcp/`, currently empty) must produce
against — the dashboard is already built and reads this shape; the server
is the missing producer.

## Division of responsibility

- **Dashboard (built):** renders `SessionQuestion[]` as forms, validates
  input client-side (`sessionSchema.ts`), computes filter/count
  (`filterSessions`/`pendingSessions` in `data.ts`). Owns no persistence.
- **MCP server (to build):** exposes a tool an agent calls to ask a
  question — shaped like `AskUserQuestion`, but multi-field and
  Zod-validated. Owns `id`/`ts` assignment and the jsonl write.
- **Hook (to build):** a `hooks/log-mcp-call.sh`-style PostToolUse hook,
  appending one line per call to `web/public/sessions.jsonl`.

## Data contract

`SessionQuestion` (`web/src/data/types.ts:165-172`):

```ts
interface SessionQuestion {
  id: string; // unique, server-assigned (mock.ts uses "q1", "q2", ...)
  header: string; // short chip label, e.g. "CTA color"
  prompt: string; // the actual question text
  ts: string; // ISO 8601, question-asked time
  status: 'pending' | 'answered';
  answeredAt?: string; // ISO 8601, set only once answered
  fields: SessionField[]; // 1+ fields — the question's form
}
```

`SessionField` is a discriminated union on `type`; every variant shares
`{ id: string; label: string }` (`types.ts:116-163`).

| type          | extra props                | `answer` type             | validation (`sessionSchema.ts::fieldSchema`)               |
| ------------- | -------------------------- | ------------------------- | ---------------------------------------------------------- |
| `text`        | `minLength?`, `maxLength?` | `string`                  | `z.string().trim().min/max`                                |
| `textarea`    | same as `text`             | `string`                  | same schema, multi-line control only                       |
| `number`      | `min?`, `max?`, `step?`    | `number`                  | `z.coerce.number().min/max`                                |
| `select`      | `options: string[]`        | `string`                  | `z.enum(options)`                                          |
| `multiselect` | `options: string[]`        | `string[]`                | `z.array(z.enum(options)).min(1)`                          |
| `boolean`     | —                          | `boolean`                 | `z.boolean()` — never "required"; `false` is a real answer |
| `date`        | —                          | `string` (`YYYY-MM-DD`)   | `z.iso.date()`                                             |
| `url`         | —                          | `string`                  | `z.url()`                                                  |
| `color`       | —                          | `string` (hex, `#rrggbb`) | `z.string().regex(/^#[0-9a-f]{6}$/i)`                      |

The MCP server's tool input schema must match this table 1:1 — a question
the server accepts but that violates `fieldSchema` could still fail
dashboard validation once rendered. (§ Zod v4 evaluation below proposes
generating that schema from `fieldSchema` directly, closing this gap.)

## Lifecycle

- Server emits a question with `status: 'pending'`, no `answer` on any
  field, no `answeredAt`.
- Dashboard filters via `SESSION_STATUS_OF` (`data.ts`): All, Pending, or
  Answered, mapped straight off `status`.
- **Not yet wired:** answering a question today only updates
  `Sessions.tsx`'s local React state (`overrides`) — it is never written
  back to `sessions.jsonl` or the server. A reload loses it. Closing that
  loop (a write-back tool, or the server persisting the answer some other
  way) is out of scope here and should be scoped as its own follow-up, not
  assumed by the server's initial build.

## Live wiring (mirrors the existing Playwright MCP call pattern)

- File: `web/public/sessions.jsonl` — append-only, one `SessionQuestion`
  JSON object per line, same shape `mcp-calls.jsonl`/`findings.jsonl`
  already use (see `hooks/log-mcp-call.sh`, `live.ts`'s `parseJsonLines`).
- `web/src/data/live.ts` needs `'/sessions.jsonl'` added to `loadState`'s
  `urls`, plus a `sessionsStore` following the existing `updateStore`
  pattern — `SESSIONS` then exports from that store instead of today's
  hardcoded `[]`.
- `web/src/data/mock.ts`'s `SESSIONS` should keep covering every field
  type at least once — `data.check.mjs` only asserts mock/live key
  parity, not shape, so this is a discipline, not an enforced check.

## MCP tool surface (proposed)

One tool, analogous to `AskUserQuestion` but fire-and-forget (the
dashboard is read-only today, see Lifecycle — it logs, it doesn't block
the agent on an answer):

```ts
ask_session_question({
  header: string,
  prompt: string,
  fields: [{
    id: string,
    label: string,
    type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'url' | 'color',
    // + that type's extra props from the table above
  }, ...],
}) => { id: string }
```

Server assigns `id` and `ts`, sets `status: 'pending'`, appends the full
`SessionQuestion` line to `sessions.jsonl`, returns the `id`.

## Non-goals

- No answer write-back tool (see Lifecycle).
- No per-prototype tagging — sessions are a session-wide, untagged stream,
  same precedent as Console/Network
  (`docs/design/2026-07-01-playwright-mcp-adoption-design.md`, Approach B).

## Zod v4 evaluation (2026-07-02, colinhacks/zod@main research)

`zod@4.4.3` is already installed — this evaluates what the installed
version offers, not an upgrade decision.

**Applied — `date` field tightened:** `sessionSchema.ts::fieldSchema`'s
`date` case was loose (`z.string().min(1)` + a `Date.parse` refine, which
accepts non-ISO input like `"Jan 1, 2020"`). Replaced with `z.iso.date()`,
a v4 top-level format validator that enforces exactly `YYYY-MM-DD` — the
same shape the native `<input type="date">` control in `Sessions.tsx`
already emits. Root-cause fix, not a new feature: tightens what was
already meant to be a date field, no schema/type change.

**Applied — `url` and `color` field types added:**

- **`url`** (`z.url()`, a v4 top-level validator). AgentCast is a
  URL-dense tool (readout voice renders MCP call args, nav URLs, artifact
  paths everywhere per DESIGN.md) — a coding agent asking "what's the
  reference URL for this design" is a realistic question `text` couldn't
  validate before. `<input type="url">`, reusing the `text` control's
  styling (`styles.input`). Seeded in mock data by `q8` (pending).
- **`color`** (`z.string().regex(/^#[0-9a-f]{6}$/i)` — no Zod top-level
  color format exists, so this stays a plain regex over a v4 primitive).
  Paired with a native `<input type="color">` swatch (new `.color` class
  in `Sessions.module.css`; browsers sanitize an empty/invalid DOM value
  to `#000000` for display only, so an untouched field still validates as
  unanswered — same "no fake default" reasoning as the `boolean` case's
  `initialValues()` comment, just resolved the opposite way since a fake
  default here _would_ wrongly satisfy the required check). Directly
  replaces the pain point this doc flagged: `mock.ts` `q1` ("Which accent
  should the primary CTA use") was a `select` of hardcoded color names
  because there was nowhere to answer with an actual hex value — `q1` now
  uses `color` directly; a new `q7` (`select`, answered) keeps that type
  covered.

`types.ts` gained `UrlSessionField`/`ColorSessionField` (both
`{ id, label, answer?: string }`, mirroring `DateSessionField`'s shape) in
the `SessionField` union; `sessionSchema.ts`, `Sessions.tsx`, and
`mock.ts` updated to match.

**Recommended for the MCP server build itself (not the dashboard):**

- **Build the tool's `inputSchema` from `z.toJSONSchema()`, not by hand.**
  v4 added `z.toJSONSchema(schema, { target: "draft-2020-12" })`,
  converting a Zod schema straight to JSON Schema. If the server defines
  its field validators as a `z.discriminatedUnion('type', [...])` mirroring
  `SessionField` (one arm per type, matching `sessionSchema.ts::fieldSchema`
  exactly), `z.toJSONSchema()` on that union produces the MCP tool's
  `inputSchema` directly — replacing this doc's "must match 1:1" table
  (§ Data contract) with a single generated source of truth instead of two
  hand-synced ones. Every field type here (`string`/`number`/`enum`/
  `array`/`boolean`) is natively representable — no `unrepresentable: "any"`
  escape hatch needed (that's only for `bigint`/`date`/`map`/`set`/etc.,
  none of which this schema uses).
- **Validate incoming tool calls with the same discriminated union,** then
  reuse the existing per-field `fieldSchema` (already in `sessionSchema.ts`,
  importable by the server since both run in the same npm workspace) to
  check each field's own constraints (`min`/`max`/`options`/etc.) are
  internally consistent before writing the `sessions.jsonl` line — e.g.
  reject a `select` field with an empty `options` array at write time
  instead of silently producing a question the dashboard can't render.
- **`z.stringbool()`** (parses `"true"`/`"yes"`/etc. to a real boolean) is
  available but not needed — MCP tool calls arrive as real JSON over
  JSON-RPC, so `boolean` fields already arrive as real booleans, not
  strings requiring coercion.
