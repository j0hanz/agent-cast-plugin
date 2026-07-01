import { memo } from 'react';
import { Main } from '../layout/Shell.tsx';
import { AgentPill, EmptyState, Panel } from '../components/ui.tsx';
import { MCP, MCP_TOOLS, MCP_CALLS, SETTINGS, AGENT, relativeTime } from '../data/data.ts';
import type { KV, McpTool, McpCall, SettingsGroup } from '../data/types.ts';
import ui from '../components/ui.module.css';
import styles from './System.module.css';

// ---- MCP rows ----
const McpToolRow = memo(({ t }: { t: McpTool }) => (
  <div className={ui.kv}>
    <span className={ui.v}>{t.name}</span>
    <span className={ui.muted}>{t.calls} calls</span>
  </div>
));

// Generic display — no per-tool formatting, since the Playwright MCP server
// is a third-party package this repo doesn't control the tool surface of.
const McpCallRow = memo(({ c }: { c: McpCall }) => {
  const args = JSON.stringify(c.input);
  return (
    <div className={ui.logrow}>
      <span className={ui.ts}>{relativeTime(c.ts)}</span>
      <span className={ui.msg}>
        <b>{c.tool}</b> {args.length > 60 ? args.slice(0, 60) + '…' : args}
      </span>
    </div>
  );
});

const McpStatRow = memo(({ s }: { s: KV }) => (
  <div className={ui.kv}>
    <span className={ui.k}>{s.k}</span>
    {s.pill ? (
      <span className={`${ui.pill} ${ui[s.pill]}`}>{s.v}</span>
    ) : (
      <span className={ui.v}>{s.v}</span>
    )}
  </div>
));

// ---- Settings rows ----
// No toggles here — nothing in this panel is actually configurable yet.
const SettingItem = memo(({ it }: { it: KV }) => (
  <div className={ui.kv}>
    <span className={ui.k}>{it.k}</span>
    <span className={ui.v}>{it.v}</span>
  </div>
));

const SettingGroup = memo(({ g }: { g: SettingsGroup }) => (
  <Panel title={g.group}>
    {g.items.map((it) => (
      <SettingItem key={it.k} it={it} />
    ))}
  </Panel>
));

// ---- Root view ----
export function System() {
  const top = (
    <>
      <div className="grow" />
      <AgentPill running={AGENT.running} stage={AGENT.stage} />
    </>
  );

  return (
    <Main topbar={top}>
      <div className={ui.dhead}>
        <h1>System</h1>
        <span className={`${ui.pill} ${ui.live}`}>MCP connected</span>
      </div>

      {/* Single unified 2-col grid — settings then MCP panels, all flowing together */}
      <div className={styles.grid}>
        {/* Settings rows */}
        {SETTINGS.length ? (
          SETTINGS.map((g) => <SettingGroup key={g.group} g={g} />)
        ) : (
          <Panel title="Settings">
            <EmptyState
              icon="settings"
              title="No settings"
              description="No configuration settings found."
            />
          </Panel>
        )}

        {/* MCP rows — continue in the same grid */}
        <Panel title="Server">
          {MCP.length ? (
            MCP.map((s) => <McpStatRow key={s.k} s={s} />)
          ) : (
            <EmptyState
              icon="server"
              title="No server info"
              description="No server information available."
            />
          )}
        </Panel>

        <Panel title="Exposed tools" count={MCP_TOOLS.length}>
          {MCP_TOOLS.length ? (
            MCP_TOOLS.map((t) => <McpToolRow key={t.name} t={t} />)
          ) : (
            <EmptyState icon="tool" title="No tools" description="No tools exposed." />
          )}
        </Panel>

        <Panel title="Recent calls">
          {MCP_CALLS.length ? (
            MCP_CALLS.map((c) => <McpCallRow key={`${c.ts}-${c.tool}`} c={c} />)
          ) : (
            <EmptyState
              icon="search"
              title="No recent calls"
              description="No MCP calls have been made yet."
            />
          )}
        </Panel>
      </div>
    </Main>
  );
}
