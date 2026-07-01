import { memo, useState } from 'react';
import { Icon } from './icons.jsx';
import { screenshotSrc } from '../data/data.js';
import styles from './ui.module.css';

// Assumes well-formed, non-nested, alternating <b>/</b> pairs — not an HTML parser.
export const RichText = memo(({ text = '' }) =>
  <span>{text.split(/<\/?b>/).map((part, i) => i % 2 ? <b key={i}>{part}</b> : part)}</span>
);

export const AgentPill = memo(({ running, stage }) => running ? (
  <div className={styles.agent}>
    <span className="pulse" /><b>Agent running</b>
    <span className={styles.sep} />
    <span className={styles.stage}>{stage}</span>
  </div>
) : null);



// ponytail: Native single-select segmented control. One option is always on,
// matching the behavior of the original ToggleGroup control.
const SingleToggle = ({ opts, value, onChange, className, itemClass, ariaLabel }) => (
  <div className={className} role="group" aria-label={ariaLabel}>
    {opts.map(o => (
      <button
        key={o}
        type="button"
        aria-pressed={value === o}
        className={itemClass}
        onClick={() => onChange(o)}
      >
        {o}
      </button>
    ))}
  </div>
);

export const Seg = memo(p => <SingleToggle {...p} className={styles.seg} ariaLabel={p['aria-label'] || "Select viewport"} />);
export const Chips = memo(p => <SingleToggle {...p} opts={p.labels} className={styles.chips} itemClass={styles.chip} />);

export const SearchBox = memo(({ value, onChange, placeholder = "Search…" }) => (
  <div className={styles.search}><Icon n="search" sw={2} />
    <input placeholder={placeholder} aria-label="Search" value={value} onChange={e => onChange(e.target.value)} />
  </div>
));

export const Panel = memo(({ title, count, children, className }) =>
  <div className={[styles.panel, className].filter(Boolean).join(' ')}>
    <div className={styles.ptitle}>{title}{count != null && <span className={styles.c}>{count}</span>}</div>
    <div className={styles.pbody}>{children}</div>
  </div>
);

export const Preview = memo(({ id, ver }) => {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(ver) && !broken;
  return (
    <div className={styles.preview}>
      <div className={styles.chrome}>
        <div className={styles.dots}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></div>
        <div className={styles.url}>localhost:5173 / {id}</div>
        <div className={styles.viewportIndicator}><span className={styles.recDot} aria-hidden="true" />Capture region</div>
      </div>
      <div className={styles.shot}>
        {showImg && (
          <img className={styles.shotImg} src={screenshotSrc(id, ver)} alt={`${id} screenshot preview`} onError={() => setBroken(true)} />
        )}
        <div className={styles.cropLT} aria-hidden="true"></div>
        <div className={styles.cropRT} aria-hidden="true"></div>
        <div className={styles.cropLB} aria-hidden="true"></div>
        <div className={styles.cropRB} aria-hidden="true"></div>
        <div className={styles.crosshair} aria-hidden="true"></div>
        <div className={styles.gridOverlay} aria-hidden="true"></div>
        {!showImg && <>
          <Icon n="monitor" sw={1.4} />
          <span className={styles.calibrationText}>Screenshot preview</span>
        </>}
      </div>
    </div>
  );
});

export const EmptyState = memo(({ icon = 'search', title = 'No results found', description = 'Try adjusting your filters.' }) => (
  <div className={styles.empty}>
    <div className={styles.icon}><Icon n={icon} sw={2} /></div>
    <h2>{title}</h2>
    <span className={styles.desc}>{description}</span>
  </div>
));
