#!/bin/bash
# PreToolUse hook: logs session events.
set -euo pipefail

LOG_DIR="${CLAUDE_PLUGIN_ROOT:-${CLAUDE_PROJECT_DIR:-$(pwd)}}/web/public"
LOG_FILE="${LOG_DIR}/log.jsonl"

mkdir -p "$LOG_DIR"

INPUT=$(cat)
if [ -z "$INPUT" ]; then
  exit 0
fi

# Skip malformed stdin instead of crashing the hook under `set -e`.
if ! echo "$INPUT" | jq empty 2>/dev/null; then
  exit 0
fi

# Generate random ID: fallback to $RANDOM if urandom is unavailable
RAND_ID=$(head /dev/urandom 2>/dev/null | tr -dc 'a-zA-Z0-9' 2>/dev/null | head -c 7 2>/dev/null || echo "$RANDOM")
if [ -z "$RAND_ID" ]; then
  RAND_ID="r$RANDOM"
fi

TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

echo "$INPUT" | jq --arg id "$RAND_ID" --arg ts "$TS" -c '
  . as $in |
  (if $in.tool_name then
     ($in.tool_name | sub("^mcp__playwright__"; "")) as $short |
     if $short == "browser_navigate" then "Navigated to <b>" + ($in.tool_input.url // "") + "</b>"
     elif $short == "browser_take_screenshot" then "Captured screenshot <b>" + ($in.tool_input.filename // $in.tool_input.name // "screenshot") + "</b>"
     elif $short == "browser_evaluate" then "Evaluating script"
     else "Running <b>" + $short + "</b>"
     end
   elif $in.prompt or $in.message then "Prompt: " + ($in.prompt // $in.message)
   else "Event received"
   end) as $msg |
  {id: $id, ts: $ts, msg: $msg}
' >> "$LOG_FILE"
