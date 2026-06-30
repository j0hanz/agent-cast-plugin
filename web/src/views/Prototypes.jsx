import { memo, useMemo, useCallback, useState } from 'react';
import { Main } from '../layout/Shell.jsx';
import { Icon } from '../components/icons.jsx';
import { AgentPill, Chips, SearchBox, EmptyState } from '../components/ui.jsx';
import { useUI } from '../state/ui.js';
import { cap, deviceIcon, filterPrototypes, filterScreenshots, screenshotSrc, relativeTime, SCREENSHOT_PROTOS, AGENT } from '../data/data.js';
import styles from './Prototypes.module.css';
import ui from '../components/ui.module.css';

// ---- Prototype card ----
const PrototypeCard = memo(({ p }) => (
  <a className={styles.card} href={'#/prototype/' + p.id}>
    <div className={styles.thumb}>{p.status === 'live' && <span className={styles.liveDot} />}<Icon n={deviceIcon(p.device)} sw={1.6} /></div>
    <div className={styles.meta}><div className={styles.title}>{p.name}</div>
      <div className={styles.row}><span className={styles.sub}>{p.device}</span><span className={`${ui.pill} ${ui[p.status]}`}>{cap(p.status)}</span></div></div>
  </a>
));

// ---- Screenshot card (inlined from Screenshots view) ----
const ScreenshotCard = memo(({ s }) => {
  const [broken, setBroken] = useState(false);
  return (
    <a className={styles.sc} href={'#/prototype/' + s.protoId}>
      <div className={styles.sthumb}>
        {broken
          ? <Icon n={s.kind === 'mobile' ? 'mobile' : 'monitor'} sw={1.5} />
          : <img className={ui.shotImg} src={screenshotSrc(s.protoId, s.ver)} alt={`${s.proto} — ${s.stage} capture, ${s.ver}`} onError={() => setBroken(true)} />}
      </div>
      <div className={styles.smeta}><div className={styles.sname}>{s.proto}</div>
        <div className={styles.srow}><span className={`${styles.tag} ${s.stage === 'critique' ? styles.crit : ''}`}>{s.stage}</span><span>{s.ver} · {relativeTime(s.capturedAt)}</span></div></div>
    </a>
  );
});

// ---- Sub-tab switcher ----
const SubTabs = memo(({ active, onChange }) => (
  <div className={styles.subtabs} role="group" aria-label="View mode">
    {['Prototypes', 'Screenshots'].map(t => (
      <button key={t} aria-pressed={active === t}
        className={`${styles.subtab} ${active === t ? styles.subtabActive : ''}`}
        onClick={() => onChange(t)}>{t}</button>
    ))}
  </div>
));

export function Prototypes() {
  const filter   = useUI(s => s.filter.prototypes);
  const query    = useUI(s => s.query.prototypes);
  const scFilter = useUI(s => s.filter.screenshots);
  const scQuery  = useUI(s => s.query.screenshots);
  const tab      = useUI(s => s.seg.prototypesTab ?? 'Prototypes');
  const setFilter = useUI(s => s.setFilter);
  const setQuery  = useUI(s => s.setQuery);
  const setSeg    = useUI(s => s.setSeg);

  const list   = useMemo(() => filterPrototypes(filter, query),     [filter, query]);
  const scList = useMemo(() => filterScreenshots(scFilter, scQuery), [scFilter, scQuery]);

  const handleQuery    = useCallback(v  => setQuery('prototypes', v),       [setQuery]);
  const handleFilter   = useCallback(v  => setFilter('prototypes', v),      [setFilter]);
  const handleScQuery  = useCallback(v  => setQuery('screenshots', v),      [setQuery]);
  const handleScFilter = useCallback(v  => setFilter('screenshots', v),     [setFilter]);
  const handleTab      = useCallback(t  => setSeg('prototypesTab', t),      [setSeg]);

  const isProtos = tab === 'Prototypes';
  const currentQuery  = isProtos ? query  : scQuery;
  const handleQChange = isProtos ? handleQuery : handleScQuery;

  const top = (
    <>
      <SubTabs active={tab} onChange={handleTab} />
      <SearchBox value={currentQuery} onChange={handleQChange} />
      <div className="grow" />
      <AgentPill running={AGENT.running} stage={AGENT.stage} />
    </>
  );

  return (
    <Main topbar={top}>
      {isProtos ? (
        <>
          <div className={styles.toolbar}>
            <Chips labels={['All', 'Live', 'Drafts', 'Passed', 'Failed']} value={filter} onChange={handleFilter} />
            <div className="grow" /><span className={styles.count}>{list.length} prototypes</span>
          </div>
          {list.length ? (
            <div className={styles.grid}>{list.map(p => <PrototypeCard key={p.id} p={p} />)}</div>
          ) : <EmptyState />}
        </>
      ) : (
        <>
          <div className={styles.toolbar}>
            <Chips labels={SCREENSHOT_PROTOS} value={scFilter} onChange={handleScFilter} />
            <div className="grow" /><span className={styles.count}>{scList.length} captures</span>
          </div>
          {scList.length ? (
            <div className={styles.sgrid}>{scList.map(s => <ScreenshotCard key={s.protoId + '-' + s.ver} s={s} />)}</div>
          ) : <EmptyState title="No captures match" description="Try clearing your search or filters." />}
        </>
      )}
    </Main>
  );
}
