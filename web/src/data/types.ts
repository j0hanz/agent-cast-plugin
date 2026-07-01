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
}

export interface McpTool {
  name: string;
  calls: number;
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
