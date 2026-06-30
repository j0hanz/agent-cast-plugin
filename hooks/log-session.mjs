import { readFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch (e) {
  process.exit(0);
}

let msg = '';
if (input.tool_name) {
  const shortName = input.tool_name.replace(/^mcp__playwright__/, '');
  if (shortName === 'browser_navigate') {
    msg = `Navigated to <b>${input.tool_input.url}</b>`;
  } else if (shortName === 'browser_take_screenshot') {
    msg = `Captured screenshot <b>${input.tool_input.filename || input.tool_input.name}</b>`;
  } else if (shortName === 'browser_evaluate') {
    msg = `Evaluating script`;
  } else {
    msg = `Running <b>${shortName}</b>`;
  }
} else if (input.prompt || input.message) {
  msg = `Prompt: ${input.prompt || input.message}`;
} else {
  msg = `Event received`;
}

const entry = {
  id: Math.random().toString(36).substring(2, 9),
  ts: new Date().toISOString(),
  msg: msg
};

const logPath = join(process.env.CLAUDE_PLUGIN_ROOT || process.cwd(), 'web', 'public', 'log.jsonl');
mkdirSync(dirname(logPath), { recursive: true });
appendFileSync(logPath, JSON.stringify(entry) + '\n');
