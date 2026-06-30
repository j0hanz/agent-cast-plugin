import { memo, useCallback } from 'react';
import { Main } from '../layout/Shell.jsx';
import { AgentPill, EmptyState, Panel, Preview, RichText, Seg } from '../components/ui.jsx';
import { useUI } from '../state/ui.js';
import { SESSION, LOG, AGENT, VERSIONS } from '../data/data.js';
import ui from '../components/ui.module.css';

const LogRow = memo(({ l }) => (
  <div className={`${ui.logrow} ${l.cur ? ui.cur : ''}`} aria-current={l.cur ? 'step' : undefined}>
    <span className={ui.ts}>{l.ts}</span>
    <span className={ui.msg}><RichText text={l.msg} /></span>
  </div>
));

export function Sandbox() {
  const dev = useUI(s => s.seg.sandbox) || 'Desktop';
  const setSeg = useUI(s => s.setSeg);
  const top = <>Sandbox<div className="grow" /><AgentPill running={AGENT.running} stage={AGENT.stage} /></>;
  return (
    <Main topbar={top}>
      <div className={ui.dhead}><h1>Live sandbox</h1><span className={`${ui.pill} ${ui.live}`}>Running</span><div className="grow" />
        <Seg opts={['Desktop', 'Tablet', 'Mobile']} value={dev} onChange={useCallback(v => setSeg('sandbox', v), [setSeg])} />
      </div>
      <div className={ui.cols} style={{ alignItems: 'stretch' }}>
        <Preview id="landing-hero" ver={VERSIONS[VERSIONS.length - 1]} />
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 'var(--s4)' }}>
          <Panel title="Session">
            {SESSION.map(s => <div key={s.k} className={ui.kv}><span className={ui.k}>{s.k}</span><span className={ui.v}>{s.v}</span></div>)}
          </Panel>
          <Panel title="Live log" style={{ overflow: 'hidden' }}>
            {LOG.length ? LOG.map(l => <LogRow key={l.id} l={l} />) : <EmptyState icon="search" title="No log entries" description="Nothing has happened in this session yet." />}
          </Panel>
        </div>
      </div>
    </Main>
  );
}
