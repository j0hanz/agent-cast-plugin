#!/bin/bash
# ponytail: fixed port + /dev/tcp probe instead of a pidfile/lockfile — good enough
# to avoid double-starting the dev server; revisit if multiple sessions ever need isolation.
set -euo pipefail

WEB_DIR="$CLAUDE_PLUGIN_ROOT/web"
PORT=5173
LOG="$WEB_DIR/.dev-server.log"

if (exec 3<>"/dev/tcp/localhost/$PORT") 2>/dev/null; then
  exec 3<&- 3>&-
else
  nohup bash -c "
    cd '$WEB_DIR'
    [ -d node_modules ] || npm install --silent
    npm run dev -- --port $PORT --strictPort
  " >>"$LOG" 2>&1 &
  disown
fi

echo "export AGENTCAST_URL=http://localhost:$PORT" >> "$CLAUDE_ENV_FILE"
