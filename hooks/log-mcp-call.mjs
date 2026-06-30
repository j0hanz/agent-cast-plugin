// PostToolUse hook (mcp__playwright__.*) — appends one JSON line per call to
// web/public/mcp-calls.jsonl. JSONL, not a shared array, so concurrent hook
// processes (parallel tool calls in one turn) can't race each other the way
// a read-modify-write of one big JSON array would.
import { readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const entry = { ts: new Date().toISOString(), tool: input.tool_name, input: input.tool_input };
const logPath = join(process.env.CLAUDE_PLUGIN_ROOT, 'web', 'public', 'mcp-calls.jsonl');

mkdirSync(dirname(logPath), { recursive: true });
appendFileSync(logPath, JSON.stringify(entry) + '\n');
