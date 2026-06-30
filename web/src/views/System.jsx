import { memo } from 'react';
import { Switch } from '@base-ui/react/switch';
import { Main } from '../layout/Shell.jsx';
import { AgentPill, Panel, RichText } from '../components/ui.jsx';
import { MCP, MCP_TOOLS, MCP_CALLS, SETTINGS, AGENT } from '../data/data.js';
import ui from '../components/ui.module.css';
import styles from './System.module.css';

// ---- MCP rows ----
const McpToolRow = memo(({ t }) => (
  <div className={ui.kv}>
    <span className={ui.v}>{t.name}</span>
    <span className={ui.muted}>{t.calls} calls</span>
  </div>
));

const McpCallRow = memo(({ c }) => (
  <div className={ui.logrow}>
    <span className={ui.ts}>{c.ts}</span>
    <span className={ui.msg}><RichText text={c.msg} /></span>
  </div>
));

const McpStatRow = memo(({ s }) => (
  <div className={ui.kv}>
    <span className={ui.k}>{s.k}</span>
    {s.pill
      ? <span className={`${ui.pill} ${ui[s.pill]}`}>{s.v}</span>
      : <span className={ui.v}>{s.v}</span>}
  </div>
));

// ---- Settings rows ----
const SettingItem = memo(({ it, groupId }) => {
  const descId = `${groupId}-readonly-note`;
  const isToggle = 'on' in it;
  return (
    <div className={ui.kv} style={isToggle ? { opacity: 0.65 } : undefined}>
      <span className={ui.k}>{it.k}</span>
      {isToggle
        ? <Switch.Root className={ui.switch} checked={it.on} disabled readOnly aria-describedby={descId}>
            <Switch.Thumb className={ui.switchThumb} />
          </Switch.Root>
        : <span className={ui.v}>{it.v}</span>}
    </div>
  );
});

const SettingGroup = memo(({ g }) => {
  const groupId = g.group.toLowerCase().replace(/\s+/g, '-');
  const descId = `${groupId}-readonly-note`;
  return (
    <Panel title={g.group}>
      {g.items.map(it => <SettingItem key={it.k} it={it} groupId={groupId} />)}
      {g.items.some(it => 'on' in it)
        ? <p id={descId} className={styles.note}>
            Managed by the plugin — change in Claude Code settings.
          </p>
        : null}
    </Panel>
  );
});

// ---- Root view ----
export function System() {
  const top = (
    <>
      System
      <div className="grow" />
      <AgentPill running={AGENT.running} stage={AGENT.stage} />
    </>
  );

  return (
    <Main topbar={top}>
      <div className={ui.dhead}>
        <h2>System</h2>
        <span className={`${ui.pill} ${ui.live}`}>MCP connected</span>
        <span className={ui.dmeta}>Read-only · managed by the plugin</span>
      </div>

      {/* Single unified 2-col grid — settings then MCP panels, all flowing together */}
      <div className={styles.grid}>
        {/* Settings rows */}
        {SETTINGS.map(g => <SettingGroup key={g.group} g={g} />)}

        {/* MCP rows — continue in the same grid */}
        <Panel title="Server">
          {MCP.map(s => <McpStatRow key={s.k} s={s} />)}
        </Panel>

        <Panel title="Exposed tools" count={MCP_TOOLS.length}>
          {MCP_TOOLS.map(t => <McpToolRow key={t.name} t={t} />)}
        </Panel>

        {/* Recent calls spans both columns */}
        <Panel title="Recent calls" className={styles.span2}>
          {MCP_CALLS.map(c => <McpCallRow key={c.id} c={c} />)}
        </Panel>
      </div>
    </Main>
  );
}
