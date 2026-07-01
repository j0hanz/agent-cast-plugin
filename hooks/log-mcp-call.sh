#!/bin/bash
# PostToolUse hook: logs MCP playwright tool call data.
set -euo pipefail

LOG_DIR="${CLAUDE_PLUGIN_ROOT:-$(pwd)}/web/public"
LOG_FILE="${LOG_DIR}/mcp-calls.jsonl"

mkdir -p "$LOG_DIR"

INPUT=$(cat)
if [ -n "$INPUT" ]; then
  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
  # Skip malformed stdin instead of crashing the hook under `set -e`.
  if echo "$INPUT" | jq empty 2>/dev/null; then
    # `output` is only captured for browser_get_config — every other tool call
    # stays input-only so high-frequency/large-payload tools (snapshot, evaluate)
    # don't bloat this file. text extracted from the standard MCP text-content
    # shape, falling back to the raw response if it isn't that shape.
    echo "$INPUT" | jq --arg ts "$TS" -c '
      {ts: $ts, tool: .tool_name, input: .tool_input} +
      (if .tool_name == "mcp__playwright__browser_get_config"
       then {output: (.tool_response.content[0].text? // .tool_response // null)}
       else {}
       end)
    ' >> "$LOG_FILE"
  fi
fi
