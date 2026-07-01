import { memo, useCallback, useState } from 'react';
import { Main } from '../layout/Shell.tsx';
import { Icon } from '../components/icons.tsx';
import { AgentPill, Chips, EmptyState } from '../components/ui.tsx';
import { useUI, setFilter, setSeg } from '../state/ui.ts';
import {
  cap,
  deviceIcon,
  filterPrototypes,
  filterScreenshots,
  screenshotSrc,
  relativeTime,
  latestScreenshot,
  SCREENSHOTS,
  screenshotProtos,
  deriveAgent,
} from '../data/data.ts';
import type { Prototype, Screenshot } from '../data/types.ts';
import styles from './Prototypes.module.css';
import ui from '../components/ui.module.css';

// ---- Prototype card ----
const PrototypeCard = memo(({ p }: { p: Prototype }) => {
  const [broken, setBroken] = useState(false);
  const latest = latestScreenshot(SCREENSHOTS.filter((s) => s.protoId === p.id));
  const showImg = Boolean(latest) && !broken;
  return (
    <a className={styles.card} href={'#/prototype/' + p.id}>
      <div className={styles.thumb}>
        {p.status === 'live' && <span className={styles.liveDot} />}
        {showImg && latest ? (
          <img
            className={ui.shotImg}
            src={screenshotSrc(p.id, latest.ver)}
            alt={`${p.name} latest capture`}
            onError={() => setBroken(true)}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Icon n={deviceIcon(p.device)} sw={1.6} />
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.title}>{p.name}</div>
        <div className={styles.row}>
          <span className={styles.sub}>{p.device}</span>
          <span className={`${ui.pill} ${ui[p.status]}`}>{cap(p.status)}</span>
        </div>
      </div>
    </a>
  );
});

// ---- Screenshot card (inlined from Screenshots view) ----
const ScreenshotCard = memo(({ s }: { s: Screenshot }) => {
  const [broken, setBroken] = useState(false);
  return (
    <a className={styles.sc} href={'#/prototype/' + s.protoId}>
      <div className={styles.sthumb}>
        {broken ? (
          <Icon n={s.kind === 'mobile' ? 'mobile' : 'monitor'} sw={1.5} />
        ) : (
          <img
            className={ui.shotImg}
            src={screenshotSrc(s.protoId, s.ver)}
            alt={`${s.proto} — ${s.stage} capture, ${s.ver}`}
            onError={() => setBroken(true)}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className={styles.smeta}>
        <div className={styles.sname}>{s.proto}</div>
        <div className={styles.srow}>
          <span className={`${styles.tag} ${s.stage === 'critique' ? styles.crit : ''}`}>
            {s.stage}
          </span>
          <span>
            {s.ver} · {relativeTime(s.capturedAt)}
          </span>
        </div>
      </div>
    </a>
  );
});

// ---- Sub-tab switcher ----
const SubTabs = memo(({ active, onChange }: { active: string; onChange: (t: string) => void }) => (
  <div className={styles.subtabs} role="group" aria-label="View mode">
    {['Prototypes', 'Screenshots'].map((t) => (
      <button
        key={t}
        aria-pressed={active === t}
        className={`${styles.subtab} ${active === t ? styles.subtabActive : ''}`}
        onClick={() => onChange(t)}
      >
        {t}
      </button>
    ))}
  </div>
));

export function Prototypes() {
  const filter = useUI((s) => s.filter.prototypes);
  const scFilter = useUI((s) => s.filter.screenshots);
  const tab = useUI((s) => s.seg.prototypesTab ?? 'Prototypes');

  const list = filterPrototypes(filter);
  const scList = filterScreenshots(scFilter);

  const handleFilter = useCallback((v: string) => setFilter('prototypes', v), []);
  const handleScFilter = useCallback((v: string) => setFilter('screenshots', v), []);
  const handleTab = useCallback(
    (t: string) => setSeg('prototypesTab', t as 'Prototypes' | 'Screenshots'),
    [],
  );

  const isProtos = tab === 'Prototypes';

  const top = (
    <>
      <SubTabs active={tab} onChange={handleTab} />
      <div className="grow" />
      <AgentPill {...deriveAgent(SCREENSHOTS)} />
    </>
  );

  return (
    <Main topbar={top}>
      <h1 className="sr-only">Prototypes and Screenshots</h1>
      {isProtos ? (
        <>
          <div className={styles.toolbar}>
            <Chips
              labels={['All', 'Live', 'Drafts', 'Passed', 'Failed']}
              value={filter}
              onChange={handleFilter}
            />
            <div className="grow" />
            <span className={styles.count}>{list.length} prototypes</span>
          </div>
          {list.length ? (
            <div className={styles.grid}>
              {list.map((p) => (
                <PrototypeCard
                  key={`${p.id}:${latestScreenshot(SCREENSHOTS.filter((s) => s.protoId === p.id))?.ver}`}
                  p={p}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </>
      ) : (
        <>
          <div className={styles.toolbar}>
            <Chips labels={screenshotProtos()} value={scFilter} onChange={handleScFilter} />
            <div className="grow" />
            <span className={styles.count}>{scList.length} captures</span>
          </div>
          {scList.length ? (
            <div className={styles.sgrid}>
              {scList.map((s) => (
                <ScreenshotCard key={s.protoId + '-' + s.ver} s={s} />
              ))}
            </div>
          ) : (
            <EmptyState title="No captures match" description="Try clearing your filters." />
          )}
        </>
      )}
    </Main>
  );
}
