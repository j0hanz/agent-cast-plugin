import { Component } from 'react';
import styles from './ui.module.css';

// Error boundaries still require a class — no hook equivalent in React 19.
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI crash:', error, info); }
  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div className={styles.empty} style={{ textAlign: 'left', gap: 'var(--s2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--bad)' }}>Render error</div>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)',
            color: 'var(--dim)', background: 'var(--surface-2)', border: '1px solid var(--line)',
            padding: 'var(--s2) var(--s3)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 160, overflow: 'auto',
          }}>{msg}</pre>
          <div style={{ display: 'flex', gap: 'var(--s1)', flexWrap: 'wrap' }}>
            <button type="button" className={styles.chip} onClick={() => this.setState({ error: null })}>Retry</button>
            <a href="/" className={styles.chip}>Reload</a>
            <button type="button" className={styles.chip}
              onClick={() => navigator.clipboard?.writeText(msg)}>Copy error</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
