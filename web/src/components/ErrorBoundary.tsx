import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ui from './ui.module.css';
import styles from './ErrorBoundary.module.css';

interface Props {
  children?: ReactNode;
}
interface State {
  error: unknown;
}

// Error boundaries still require a class — no hook equivalent in React 19.
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };
  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }
  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('UI crash:', error, info);
  }
  override render() {
    if (this.state.error) {
      const msg = describeError(this.state.error);
      return (
        <div className={`${ui.empty} ${ui.left}`}>
          <div className={styles.title}>Render error</div>
          <pre className={styles.trace}>{msg}</pre>
          <div className={styles.actions}>
            <button
              type="button"
              className={ui.chip}
              onClick={() => this.setState({ error: null })}
            >
              Retry
            </button>
            <a href="/" className={ui.chip}>
              Reload
            </a>
            <button
              type="button"
              className={ui.chip}
              onClick={() => {
                void navigator.clipboard?.writeText(msg);
              }}
            >
              Copy error
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err) ?? 'Unknown error';
  } catch {
    return 'Unknown error';
  }
}
