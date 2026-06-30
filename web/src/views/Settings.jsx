import { memo } from 'react';
import { Switch } from '@base-ui/react/switch';
import { Main } from '../layout/Shell.jsx';
import { Panel } from '../components/ui.jsx';
import { SETTINGS } from '../data/data.js';
import styles from './Settings.module.css';
import ui from '../components/ui.module.css';

const SettingItem = memo(({ it, groupId }) => {
  const descId = `${groupId}-readonly-note`;
  const isToggle = 'on' in it;
  return (
    <div className={ui.kv} style={isToggle ? { opacity: 0.65 } : undefined}>
      <span className={ui.k}>{it.k}</span>
      {isToggle
        ? <Switch.Root className={ui.switch} checked={it.on} disabled readOnly
            aria-describedby={descId}>
            <Switch.Thumb className={ui.switchThumb} />
          </Switch.Root>
        : <span className={ui.v}>{it.v}</span>}
    </div>
  );
});

const SettingGroup = memo(({ g }) => {
  const groupId = g.group.toLowerCase().replace(/\s+/g, '-');
  const descId = `${groupId}-readonly-note`;
  return (
    <Panel title={g.group}>
      {g.items.map(it => <SettingItem key={it.k} it={it} groupId={groupId} />)}
      {g.items.some(it => 'on' in it)
        ? <p id={descId} style={{ fontSize: '0.6875rem', color: 'var(--mut)', marginTop: 8, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
            Managed by the plugin — change in Claude Code settings.
          </p>
        : null}
    </Panel>
  );
});

export function Settings() {
  const top = <>Settings<div className="grow" /></>;
  return (
    <Main topbar={top}>
      <div className={ui.dhead}><h2>Settings</h2><span className={ui.dmeta}>Read-only · managed by the plugin</span></div>
      <div className={styles.setgrid}>{SETTINGS.map(g => <SettingGroup key={g.group} g={g} />)}</div>
    </Main>
  );
}
