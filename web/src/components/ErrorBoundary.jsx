import { Component } from 'react';
import ui from './ui.module.css';
import styles from './ErrorBoundary.module.css';

// Error boundaries still require a class — no hook equivalent in React 19.
export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('UI crash:', error, info); }
  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error);
      return (
        <div className={`${ui.empty} ${ui.left}`}>
          <div className={styles.title}>Render error</div>
          <pre className={styles.trace}>{msg}</pre>
          <div className={styles.actions}>
            <button type="button" className={ui.chip} onClick={() => this.setState({ error: null })}>Retry</button>
            <a href="/" className={ui.chip}>Reload</a>
            <button type="button" className={ui.chip}
              onClick={() => navigator.clipboard?.writeText(msg)}>Copy error</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
