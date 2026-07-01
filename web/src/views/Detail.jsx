import { memo, useCallback } from 'react';
import { Main } from '../layout/Shell.jsx';
import { Icon } from '../components/icons.jsx';
import { AgentPill, EmptyState, Panel, Preview, Seg } from '../components/ui.jsx';
import { useUI } from '../state/ui.js';
import { cap, PROTOTYPES, versionsFor, loopFor, findingsFor, VIEWPORTS, AGENT } from '../data/data.js';
import styles from './Detail.module.css';
import ui from '../components/ui.module.css';

const StepRow = memo(({ s }) => (
  <div className={`${styles.s} ${styles[s.state] || ''}`}><span className={styles.dot} /><div className={styles.n}>{s.name}</div><div className={styles.t}>{s.t}</div></div>
));

const FindingRow = memo(({ f }) => (
  <div className={`${styles.finding} ${styles[f.sev]}`}>
    <span className={styles.sev} aria-hidden="true" />
    <div>
      <div className={styles.f}>
        <span className="sr-only">{cap(f.sev)} severity finding: </span>
        {f.text}
      </div>
      <div className={styles.loc}>{f.loc}</div>
    </div>
  </div>
));

export function Detail({ id }) {
  const segDetail = useUI(s => s.seg.detail);
  const setSeg = useUI(s => s.setSeg);
  const handleDevChange = useCallback(v => setSeg('detail', v), [setSeg]);
  const p = PROTOTYPES.find(x => x.id === id);
  if (!p) {
    return (
      <Main topbar={<p className={styles.crumb}>Prototype not found</p>}>
        <EmptyState icon="search" title="Prototype not found" description="The requested prototype does not exist." />
      </Main>
    );
  }
  const dev = segDetail || p.device;
  const findings = findingsFor(p.id);
  const versions = versionsFor(p.id);
  const loop = loopFor(p.id);
  const top = <>
    <nav aria-label="breadcrumb">
      <ol className={styles.crumbList}>
        <li>
          <a href="#/prototypes" className={styles.crumbLink}>
            <Icon n="back" sw={2.2} />
            Prototypes
          </a>
        </li>
        <li aria-hidden="true" className={styles.crumbSep}>›</li>
        <li aria-current="page" className={styles.crumb}>{p.name}</li>
      </ol>
    </nav>
    <div className="grow" /><AgentPill running={AGENT.running} stage={AGENT.stage} />
  </>;
  return (
    <Main topbar={top}>
      <div className={ui.dhead}><h1>{p.name}</h1><span className={`${ui.pill} ${ui[p.status]}`}>{cap(p.status)}</span>
        <span className={ui.dmeta}>{dev} · {VIEWPORTS[dev]}</span><div className="grow" />
        <Seg opts={['Desktop', 'Tablet', 'Mobile']} value={dev} onChange={handleDevChange} />
      </div>
      <div className={`${ui.cols} ${ui.stretch}`}>
        <div className={ui.rail}>
          <Preview id={p.id} ver={versions[versions.length - 1]} />
          <Panel title="Captured versions" count={`${versions.length} iterations`}>
            <div className={styles.versions}>{versions.map((v, i) => {
              const curr = i === versions.length - 1;
              return <div key={v} className={`${styles.ver} ${curr ? styles.cur : ''}`}>{v}{curr && ' · current'}</div>;
            })}</div>
          </Panel>
        </div>
        <div className={ui.stackFill}>
          <Panel title="Loop progress">
            <div className={styles.vstep}>{loop.map(s => <StepRow key={s.name} s={s} />)}</div>
          </Panel>
          <Panel title="Critique findings" count={`${findings.length} open`} className={ui.clip}>
            {findings.length ? findings.map((f, i) => <FindingRow key={`${f.loc}-${i}`} f={f} />) : <EmptyState icon="search" title="No findings" description="This prototype has no open critique findings." />}
          </Panel>
        </div>
      </div>
    </Main>
  );
}

