import { memo } from 'react';
import { Main } from '../layout/Shell.jsx';
import { AgentPill, Panel, RichText } from '../components/ui.jsx';
import { MCP, MCP_TOOLS, MCP_CALLS, AGENT } from '../data/data.js';
import ui from '../components/ui.module.css';

const McpToolRow = memo(({ t }) => <div className={ui.kv}><span className={ui.v}>{t.name}</span><span className={ui.muted}>{t.calls} calls</span></div>);
const McpCallRow = memo(({ c }) => <div className={ui.logrow}><span className={ui.ts}>{c.ts}</span><span className={ui.msg}><RichText text={c.msg} /></span></div>);
const McpStatRow = memo(({ s }) => <div className={ui.kv}><span className={ui.k}>{s.k}</span>{s.pill ? <span className={`${ui.pill} ${ui[s.pill]}`}>{s.v}</span> : <span className={ui.v}>{s.v}</span>}</div>);

export function Mcp() {
  const top = <>MCP Server<div className="grow" /><AgentPill running={AGENT.running} stage={AGENT.stage} /></>;
  return (
    <Main topbar={top}>
      <div className={ui.dhead}><h2>agent-browser MCP</h2><span className={`${ui.pill} ${ui.live}`}>Connected</span></div>
      <div className={ui.cols}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)', minWidth: 0 }}>
          <Panel title="Exposed tools" count={MCP_TOOLS.length}>
            {MCP_TOOLS.map(t => <McpToolRow key={t.name} t={t} />)}
          </Panel>
          <Panel title="Recent calls">
            {MCP_CALLS.map(c => <McpCallRow key={c.id} c={c} />)}
          </Panel>
        </div>
        <div className={ui.rail}>
          <Panel title="Server">
            {MCP.map(s => <McpStatRow key={s.k} s={s} />)}
          </Panel>
        </div>
      </div>
    </Main>
  );
}
