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
    echo "$INPUT" | jq --arg ts "$TS" -c '{ts: $ts, tool: .tool_name, input: .tool_input}' >> "$LOG_FILE"
  fi
fi
