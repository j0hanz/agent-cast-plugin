import { memo } from 'react';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { Input } from '@base-ui/react/input';
import { Icon } from './icons.jsx';
import styles from './ui.module.css';

export const RichText = memo(({ text = '' }) =>
  <span dangerouslySetInnerHTML={{ __html: text }} />
);

export const AgentPill = memo(({ running, stage }) => running ? (
  <div className={styles.agent}>
    <span className="pulse" /><b>Agent running</b>
    <span className={styles.sep} />
    <span className={styles.stage}>{stage}</span>
  </div>
) : null);



// ponytail: ToggleGroup is always-array, even in single-select mode, and
// clicking the active item emits [] (deselect). Seg/Chips are segmented
// controls — one option is always on — so an empty next value is ignored.
const SingleToggle = ({ opts, value, onChange, className, itemClass, ariaLabel }) => (
  <ToggleGroup className={className} value={[value]} onValueChange={next => next.length && onChange(next[0])} aria-label={ariaLabel}>
    {opts.map(o => <Toggle key={o} value={o} className={itemClass}>{o}</Toggle>)}
  </ToggleGroup>
);

export const Seg = memo(p => <SingleToggle {...p} className={styles.seg} ariaLabel={p['aria-label'] || "Select viewport"} />);
export const Chips = memo(p => <SingleToggle {...p} opts={p.labels} className={styles.chips} itemClass={styles.chip} />);

export const SearchBox = memo(({ value, onChange, placeholder = "Search…" }) => (
  <div className={styles.search}><Icon n="search" sw={2} />
    <Input placeholder={placeholder} aria-label="Search" value={value} onValueChange={onChange} />
  </div>
));

export const Panel = memo(({ title, count, children, className, style }) =>
  <div className={[styles.panel, className].filter(Boolean).join(' ')} style={style}>
    <div className={styles.ptitle}>{title}{count != null && <span className={styles.c}>{count}</span>}</div>
    <div className={styles.pbody}>{children}</div>
  </div>
);

export const Preview = memo(({ id }) => (
  <div className={styles.preview}>
    <div className={styles.chrome}>
      <div className={styles.dots}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></div>
      <div className={styles.url}>localhost:5173 / {id}</div>
      <div className={styles.viewportIndicator}><span className={styles.recDot} aria-hidden="true" />Capture region</div>
    </div>
    <div className={styles.shot}>
      <div className={styles.cropLT} aria-hidden="true"></div>
      <div className={styles.cropRT} aria-hidden="true"></div>
      <div className={styles.cropLB} aria-hidden="true"></div>
      <div className={styles.cropRB} aria-hidden="true"></div>
      <div className={styles.crosshair} aria-hidden="true"></div>
      <div className={styles.gridOverlay} aria-hidden="true"></div>
      <Icon n="monitor" sw={1.4} />
      <span className={styles.calibrationText}>Screenshot preview</span>
    </div>
  </div>
));

export const EmptyState = memo(({ icon = 'search', title = 'No results found', description = 'Try adjusting your filters.' }) => (
  <div className={styles.empty}>
    <div style={{ marginBottom: 12, opacity: 0.5 }}><Icon n={icon} sw={2} /></div>
    <h3>{title}</h3>
    <p style={{ marginTop: 4 }}>{description}</p>
  </div>
));
