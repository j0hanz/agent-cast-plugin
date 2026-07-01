import { memo } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/icons.tsx';
import type { IconName } from '../components/icons.tsx';
import { NAV, SYSTEM } from '../data/data.ts';
import styles from './Shell.module.css';

interface NavEntry {
  id: string;
  label: string;
  icon: IconName;
}

const NavItem = memo(({ n, active }: { n: NavEntry; active: string | null }) => (
  <a
    className={`${styles.item} ${n.id === active ? styles.active : ''}`}
    href={'#/' + n.id}
    aria-current={n.id === active ? 'page' : undefined}
    aria-label={n.label}
    title={n.label}
  >
    <Icon n={n.icon} />
    <span className={styles.lbl}>{n.label}</span>
  </a>
));

export const Sidebar = memo(({ active }: { active: string | null }) => (
  <aside className={styles.side}>
    <div className={styles.brand}>
      <div className={styles.mark}>
        <Icon n="logo" sw={2} />
      </div>
      <div>
        <div className={styles.name}>AgentCast</div>
        <div className={styles.sub}>control center</div>
      </div>
    </div>
    <nav aria-label="Main navigation">
      <div className={styles.navlabel}>Workspace</div>
      {NAV.map((n) => (
        <NavItem key={n.id} n={n} active={active} />
      ))}
      {SYSTEM.map((n) => (
        <NavItem key={n.id} n={n} active={active} />
      ))}
    </nav>
  </aside>
));

export function Main({ topbar, children }: { topbar?: ReactNode; children?: ReactNode }) {
  return (
    <main className={styles.main} id="main-content">
      <header className={styles.topbar}>{topbar}</header>
      <div className={styles.body}>
        <div className={styles.wrap}>{children}</div>
      </div>
    </main>
  );
}
