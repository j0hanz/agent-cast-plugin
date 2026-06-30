#!/bin/bash
# PostToolUse hook: updates the dashboard screenshot state.
set -euo pipefail

LOG_DIR="${CLAUDE_PLUGIN_ROOT:-$(pwd)}/web/public"
STATE_FILE="${LOG_DIR}/state.json"

mkdir -p "$LOG_DIR"

INPUT=$(cat)
if [ -z "$INPUT" ]; then
  exit 0
fi

# Extract filename
FILENAME=$(echo "$INPUT" | jq -r '.tool_input.filename // .tool_input.name // ""')

if [ -n "$FILENAME" ] && [ "$FILENAME" != "null" ]; then
  BASENAME=$(basename "$FILENAME")
  
  # Try to parse the filename using jq regex capture. `?` + `// empty` makes
  # a non-matching filename (e.g. a default Playwright name) yield nothing at
  # all instead of a fake object with missing protoId/ver defaulted to "null".
  PARSED=$(jq -n --arg base "$BASENAME" '$base | capture("^(?<protoId>.+?)(?:-(?<kind>desktop|tablet|mobile))?(?:-(?<stage>preview|critique|final))?-(?<ver>v[0-9]+)\\.png$")? // empty | .kind //= "desktop" | .stage //= "preview"' 2>/dev/null || echo "")

  if [ -n "$PARSED" ] && [ "$(echo "$PARSED" | jq -r '.protoId // empty')" != "" ] && [ "$(echo "$PARSED" | jq -r '.ver // empty')" != "" ]; then
    PROTO_ID=$(echo "$PARSED" | jq -r '.protoId')
    KIND=$(echo "$PARSED" | jq -r '.kind')
    STAGE=$(echo "$PARSED" | jq -r '.stage')
    VER=$(echo "$PARSED" | jq -r '.ver')
    
    # Capitalize first letter of protoId and replace hyphens with spaces
    PROTO=$(jq -n --arg id "$PROTO_ID" '$id | (.[0:1] | ascii_upcase) + (.[1:] | gsub("-"; " "))' -r)
    
    TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")
    
    # Build new entry
    ENTRY=$(jq -n \
      --arg protoId "$PROTO_ID" \
      --arg proto "$PROTO" \
      --arg kind "$KIND" \
      --arg stage "$STAGE" \
      --arg ver "$VER" \
      --arg ts "$TS" \
      '{protoId: $protoId, proto: $proto, kind: $kind, stage: $stage, ver: $ver, capturedAt: $ts}')
      
    # Copy/move screenshot file if it exists (Phase 2.1 - Screenshot File Pipeline)
    SCREENSHOTS_DIR="${LOG_DIR}/screenshots"
    mkdir -p "$SCREENSHOTS_DIR"
    
    if [ -f "$FILENAME" ]; then
      cp "$FILENAME" "${SCREENSHOTS_DIR}/${BASENAME}"
    elif [ -f "${CLAUDE_PLUGIN_ROOT:-$(pwd)}/${FILENAME}" ]; then
      cp "${CLAUDE_PLUGIN_ROOT:-$(pwd)}/${FILENAME}" "${SCREENSHOTS_DIR}/${BASENAME}"
    elif [ -f "$(pwd)/${FILENAME}" ]; then
      cp "$(pwd)/${FILENAME}" "${SCREENSHOTS_DIR}/${BASENAME}"
    fi

    # Acquire lock for state.json (Issue #2 - Concurrency Fix)
    LOCK_DIR="${STATE_FILE}.lock"
    LOCKED=false
    for i in {1..50}; do
      if mkdir "$LOCK_DIR" 2>/dev/null; then
        LOCKED=true
        break
      fi
      sleep 0.1
    done

    if [ "$LOCKED" != true ]; then
      echo "update-state.sh: could not acquire lock on $LOCK_DIR after 5s, skipping write" >&2
      exit 0
    fi

    # Read existing state or initialize empty structure
    if [ -f "$STATE_FILE" ]; then
      EXISTING=$(cat "$STATE_FILE")
    else
      EXISTING='{"screenshots": []}'
    fi

    # Validate that EXISTING is valid JSON
    if ! echo "$EXISTING" | jq empty 2>/dev/null; then
      EXISTING='{"screenshots": []}'
    fi

    # Prepend new entry to screenshots array
    NEW_STATE=$(echo "$EXISTING" | jq --argjson entry "$ENTRY" '.screenshots = ([$entry] + (.screenshots // []))')

    # Write back
    echo "$NEW_STATE" > "$STATE_FILE"

    # Release lock (only ours — guaranteed since we only reach here after acquiring it)
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
fi
