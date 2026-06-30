import { memo } from 'react';
import { Icon } from '../components/icons.jsx';
import { NAV, SYSTEM } from '../data/data.js';
import styles from './Shell.module.css';

const NavItem = memo(({ n, active }) =>
  <a className={`${styles.item} ${n.id === active ? styles.active : ''}`} href={'#/' + n.id}
    aria-current={n.id === active ? 'page' : undefined}
    aria-label={n.label}>
    <Icon n={n.icon} /><span className={styles.lbl}>{n.label}</span>
  </a>
);

export const Sidebar = memo(({ active }) => (
  <aside className={styles.side}>
    <div className={styles.brand}><div className={styles.mark}><Icon n="logo" sw={2} /></div>
      <div><div className={styles.name}>AgentCast</div><div className={styles.sub}>control center</div></div></div>
    <nav aria-label="Main navigation">
      <div className={styles.navlabel}>Workspace</div>
      {NAV.map(n => <NavItem key={n.id} n={n} active={active} />)}
      <div className={styles.navlabel} style={{ marginTop: 'var(--s2)' }}>System</div>
      {SYSTEM.map(n => <NavItem key={n.id} n={n} active={active} />)}
    </nav>
    <div className="grow" />
    <div className={styles.status} aria-label="agent-browser MCP (Connected)"><span className="pulse" /><span>agent-browser MCP</span></div>
  </aside>
));

export function Main({ topbar, children }) {
  return (
    <main className={styles.main} id="main-content">
      <header className={styles.topbar}>{topbar}</header>
      <div className={styles.body}><div className={styles.wrap}>{children}</div></div>
    </main>
  );
}
