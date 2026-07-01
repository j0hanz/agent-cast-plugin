import { memo, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './icons.tsx';
import type { IconName } from './icons.tsx';
import { screenshotSrc } from '../data/data.ts';
import styles from './ui.module.css';

const BOLD_TAG_REGEX = /<\/?b>/;

// Assumes well-formed, non-nested, alternating <b>/</b> pairs — not an HTML parser.
export const RichText = memo(({ text = '' }: { text?: string }) => (
  <span>{text.split(BOLD_TAG_REGEX).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))}</span>
));

export const AgentPill = memo(({ running, stage }: { running: boolean; stage: string }) =>
  running ? (
    <div className={styles.agent}>
      <span className="pulse" />
      <b>Agent running</b>
      <span className={styles.sep} />
      <span className={styles.stage}>{stage}</span>
    </div>
  ) : null,
);

// ponytail: Native single-select segmented control. One option is always on,
// matching the behavior of the original ToggleGroup control.
interface SingleToggleProps {
  opts: string[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  itemClass?: string;
  ariaLabel?: string;
}

const SingleToggle = ({
  opts,
  value,
  onChange,
  className,
  itemClass,
  ariaLabel,
}: SingleToggleProps) => (
  <div className={className} role="group" aria-label={ariaLabel}>
    {opts.map((o) => (
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

interface SegProps {
  opts: string[];
  value: string;
  onChange: (val: string) => void;
  'aria-label'?: string;
}
export const Seg = memo((p: SegProps) => (
  <SingleToggle {...p} className={styles.seg} ariaLabel={p['aria-label'] ?? 'Select viewport'} />
));

interface ChipsProps {
  labels: string[];
  value: string;
  onChange: (val: string) => void;
}
export const Chips = memo((p: ChipsProps) => (
  <SingleToggle {...p} opts={p.labels} className={styles.chips} itemClass={styles.chip} />
));

interface PanelProps {
  title: ReactNode;
  count?: ReactNode;
  children?: ReactNode;
  className?: string;
}
export const Panel = memo(({ title, count, children, className }: PanelProps) => (
  <div className={[styles.panel, className].filter(Boolean).join(' ')}>
    <div className={styles.ptitle}>
      {title}
      {count != null && <span className={styles.c}>{count}</span>}
    </div>
    <div className={styles.pbody}>{children}</div>
  </div>
));

interface PreviewProps {
  id: string;
  ver?: string;
  stage?: string;
}
export const Preview = memo(({ id, ver, stage }: PreviewProps) => {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(ver) && !broken;
  return (
    <div className={styles.preview}>
      <div className={styles.chrome}>
        <div className={styles.dots}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        <div className={styles.url}>localhost:5173 / {id}</div>
        <div className={styles.viewportIndicator}>
          <span className={styles.recDot} aria-hidden="true" />
          Capture region
        </div>
      </div>
      <div className={styles.shot}>
        {ver && !broken && (
          <img
            className={styles.shotImg}
            src={screenshotSrc(id, ver)}
            alt={`${id} screenshot, ${ver}${stage ? `, ${stage}` : ''}`}
            onError={() => setBroken(true)}
            loading="eager"
            decoding="async"
          />
        )}
        <div className={styles.cropLT} aria-hidden="true"></div>
        <div className={styles.cropRT} aria-hidden="true"></div>
        <div className={styles.cropLB} aria-hidden="true"></div>
        <div className={styles.cropRB} aria-hidden="true"></div>
        <div className={styles.crosshair} aria-hidden="true"></div>
        <div className={styles.gridOverlay} aria-hidden="true"></div>
        {!showImg && (
          <>
            <Icon n="monitor" sw={1.4} />
            <span className={styles.calibrationText}>Screenshot preview</span>
          </>
        )}
      </div>
    </div>
  );
});

interface EmptyStateProps {
  icon?: IconName;
  title?: string;
  description?: string;
}
export const EmptyState = memo(
  ({
    icon = 'search',
    title = 'No results found',
    description = 'Try adjusting your filters.',
  }: EmptyStateProps) => (
    <div className={styles.empty}>
      <div className={styles.icon}>
        <Icon n={icon} sw={2} />
      </div>
      <h2>{title}</h2>
      <span className={styles.desc}>{description}</span>
    </div>
  ),
);
