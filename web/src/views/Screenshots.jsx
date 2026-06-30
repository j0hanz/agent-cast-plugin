import { memo, useMemo, useCallback } from 'react';
import { Main } from '../layout/Shell.jsx';
import { Icon } from '../components/icons.jsx';
import { AgentPill, Chips, SearchBox, EmptyState } from '../components/ui.jsx';
import { useUI } from '../state/ui.js';
import { filterScreenshots, SCREENSHOT_PROTOS, AGENT } from '../data/data.js';
import styles from './Screenshots.module.css';

const ScreenshotCard = memo(({ s }) => (
  <a className={styles.sc} href={'#/prototype/' + s.protoId}>
    <div className={styles.sthumb}><Icon n={s.kind === 'mobile' ? 'mobile' : 'monitor'} sw={1.5} /></div>
    <div className={styles.smeta}><div className={styles.sname}>{s.proto}</div>
      <div className={styles.srow}><span className={`${styles.tag} ${s.stage === 'critique' ? styles.crit : ''}`}>{s.stage}</span><span>{s.ver} · {s.time}</span></div></div>
  </a>
));

export function Screenshots() {
  const filter = useUI(s => s.filter.screenshots);
  const query = useUI(s => s.query.screenshots);
  const setFilter = useUI(s => s.setFilter);
  const setQuery = useUI(s => s.setQuery);
  const list = useMemo(() => filterScreenshots(filter, query), [filter, query]);
  const handleQuery = useCallback(v => setQuery('screenshots', v), [setQuery]);
  const handleFilter = useCallback(v => setFilter('screenshots', v), [setFilter]);
  const top = <>Screenshots<SearchBox value={query} onChange={handleQuery} /><div className="grow" /><AgentPill running={AGENT.running} stage={AGENT.stage} /></>;
  return (
    <Main topbar={top}>
      <div className={styles.toolbar}>
        <Chips labels={SCREENSHOT_PROTOS} value={filter} onChange={handleFilter} />
        <div className="grow" /><span className={styles.count}>{list.length} captures</span>
      </div>
      {list.length ? (
        <div className={styles.sgrid}>{list.map(s => <ScreenshotCard key={s.protoId + '-' + s.ver} s={s} />)}</div>
      ) : <EmptyState title="No captures match" description="Try clearing your search or filters." />}
    </Main>
  );
}
