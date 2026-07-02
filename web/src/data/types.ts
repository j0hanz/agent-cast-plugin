// Shared shapes for mock.ts / live.ts — one definition forces both to match
// structurally, which is what data.check.mjs's key-parity assert checked at
// runtime before this migration.

export type Device = 'Desktop' | 'Tablet' | 'Mobile';
export type Status = 'live' | 'draft' | 'passed' | 'failed';
export type Severity = 'high' | 'med' | 'low';
export type Stage = 'preview' | 'critique' | 'final' | '';
export type TestStatus = 'passed' | 'failed' | 'running' | 'queued';

export interface Prototype {
  id: string;
  name: string;
  device: Device;
  status: Status;
}

export interface Screenshot {
  protoId: string;
  proto: string;
  kind: 'desktop' | 'tablet' | 'mobile';
  stage: Stage;
  ver: string;
  capturedAt: string;
}

export interface Finding {
  protoId: string;
  ver: string;
  sev: Severity;
  text: string;
  loc: string;
}

export interface TestRun {
  protoId: string;
  ver: string;
  name: string;
  checks: number;
  pass: number;
  total: number;
  status: TestStatus;
}

// Raw per-run record from tests.jsonl / testStatus's `run` argument — narrower
// than TestRun (no `checks`/`status`, those are derived from this).
export interface TestRunInput {
  protoId: string;
  ver: string;
  name: string;
  pass: number;
  total: number;
}

export interface LogEntry {
  id: string;
  ts: string;
  msg: string;
  cur?: boolean;
}

export interface McpCall {
  ts: string;
  tool: string;
  input: Record<string, unknown>;
  // Only populated for browser_get_config (see log-mcp-call.sh) — every other
  // tool call is input-only to keep the log from bloating on large payloads.
  output?: unknown;
}

export interface McpTool {
  name: string;
  calls: number;
}

// Session-wide audit rows derived from browser_console_messages /
// browser_network_requests calls — one line each, not one per call (a single
// call can report several errors/failed requests at once).
export interface ConsoleEntry {
  ts: string;
  text: string;
}

export interface NetworkEntry {
  ts: string;
  text: string;
}

// SESSION / MCP / Settings rows share this flat key-value shape.
export interface KV {
  k: string;
  v: string;
  pill?: string;
}

export interface SettingsGroup {
  group: string;
  items: KV[];
}

export interface Agent {
  running: boolean;
  stage: string;
}

export interface LoopStep {
  name: string;
  state: 'live' | 'done' | '';
  t: string;
}

// Sessions: agent-asked questions rendered as Zod-validated forms (an
// extended AskUserQuestion). Field shape carries its own constraints
// (min/max/length/options) so sessionSchema.ts can build a real runtime
// validator from it, not just a display hint.
interface SessionFieldBase {
  id: string;
  label: string;
}
export interface TextSessionField extends SessionFieldBase {
  type: 'text' | 'textarea';
  minLength?: number;
  maxLength?: number;
  answer?: string;
}
export interface NumberSessionField extends SessionFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  answer?: number;
}
export interface ChoiceSessionField extends SessionFieldBase {
  type: 'select' | 'multiselect';
  options: string[];
  answer?: string | string[];
}
export interface BooleanSessionField extends SessionFieldBase {
  type: 'boolean';
  answer?: boolean;
}
export interface DateSessionField extends SessionFieldBase {
  type: 'date';
  answer?: string;
}
export interface UrlSessionField extends SessionFieldBase {
  type: 'url';
  answer?: string;
}
export interface ColorSessionField extends SessionFieldBase {
  type: 'color';
  answer?: string; // hex, e.g. "#f5a524"
}
export type SessionField =
  | TextSessionField
  | NumberSessionField
  | ChoiceSessionField
  | BooleanSessionField
  | DateSessionField
  | UrlSessionField
  | ColorSessionField;

export type SessionStatus = 'pending' | 'answered';

export interface SessionQuestion {
  id: string;
  header: string;
  prompt: string;
  ts: string;
  status: SessionStatus;
  answeredAt?: string;
  fields: SessionField[];
}
