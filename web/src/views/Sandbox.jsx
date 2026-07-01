import { memo, useCallback } from 'react';
import { Main } from '../layout/Shell.jsx';
import { AgentPill, EmptyState, Panel, Preview, RichText, Seg } from '../components/ui.jsx';
import { useUI } from '../state/ui.js';
import { SESSION, LOG, AGENT, SCREENSHOTS, latestScreenshot } from '../data/data.js';
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
  const top = <><div className="grow" /><AgentPill running={AGENT.running} stage={AGENT.stage} /></>;

  // Resolve active prototype/version by capturedAt, not array position —
  // screenshot order isn't guaranteed chronological.
  const latest = latestScreenshot(SCREENSHOTS);
  const activeProtoId = latest?.protoId || 'landing-hero';
  const activeVer = latest?.ver || 'v1';

  return (
    <Main topbar={top}>
      <div className={ui.dhead}><h1>Live sandbox</h1><span className={`${ui.pill} ${ui.live}`}>Running</span><div className="grow" />
        <Seg opts={['Desktop', 'Tablet', 'Mobile']} value={dev} onChange={useCallback(v => setSeg('sandbox', v), [setSeg])} />
      </div>
      <div className={`${ui.cols} ${ui.stretch}`}>
        <Preview key={`${activeProtoId}:${activeVer}`} id={activeProtoId} ver={activeVer} stage={latest?.stage} />
        <div className={ui.stackFill}>
          <Panel title="Session">
            {SESSION.length ? SESSION.map(s => <div key={s.k} className={ui.kv}><span className={ui.k}>{s.k}</span><span className={ui.v}>{s.v}</span></div>) : <EmptyState icon="sandbox" title="No session data" description="The session hasn't started or no data was captured." />}
          </Panel>
          <Panel title="Live log" className={ui.clip}>
            {LOG.length ? LOG.map(l => <LogRow key={l.id} l={l} />) : <EmptyState icon="search" title="No log entries" description="Nothing has happened in this session yet." />}
          </Panel>
        </div>
      </div>
    </Main>
  );
}
