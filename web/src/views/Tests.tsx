import { memo } from 'react';
import { Main } from '../layout/Shell.tsx';
import { AgentPill, EmptyState } from '../components/ui.tsx';
import { TESTS, testSummary, deriveAgent, SCREENSHOTS, MCP_CALLS } from '../data/data.ts';
import type { TestRun } from '../data/types.ts';
import styles from './Tests.module.css';
import ui from '../components/ui.module.css';

const TestRow = memo(({ t }: { t: TestRun }) => {
  const pct = Math.round((t.pass / t.total) * 100);
  const map = {
    passed: {
      bar: <span aria-hidden="true" />,
      txt: `${t.pass}/${t.total}`,
      pill: <span className={`${ui.pill} ${ui.passed} ${styles.right}`}>Passed</span>,
      pct: 100,
    },
    failed: {
      bar: <span aria-hidden="true" className={styles.part} style={{ width: pct + '%' }} />,
      txt: `${t.pass}/${t.total}`,
      pill: <span className={`${ui.pill} ${ui.failed} ${styles.right}`}>Failed</span>,
      pct,
    },
    running: {
      bar: <span aria-hidden="true" className={styles.running} />,
      txt: <span className={ui.muted}>running</span>,
      pill: <span className={`${ui.pill} ${ui.live} ${styles.right}`}>Running</span>,
      pct: 40,
    },
    queued: {
      bar: null,
      txt: <span className={ui.muted}>—</span>,
      pill: <span className={`${ui.pill} ${styles.right}`}>Queued</span>,
      pct: 0,
    },
  }[t.status];
  return (
    <div className={styles.trow}>
      <span className={styles.tname}>{t.name}</span>
      <span className={ui.muted}>{t.checks} checks</span>
      <div className={styles.result}>
        {/* L6: role=progressbar makes the pass ratio accessible to screen readers */}
        <div
          className={styles.ratio}
          role="progressbar"
          aria-label={`${t.name} pass rate`}
          aria-valuenow={map.pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {map.bar}
        </div>
        <span className={styles.rtext}>{map.txt}</span>
      </div>
      {map.pill}
    </div>
  );
});

export function Tests() {
  const { passing, failing, suites } = testSummary(TESTS);
  const top = (
    <>
      <div className="grow" />
      <AgentPill {...deriveAgent(SCREENSHOTS, MCP_CALLS)} />
    </>
  );
  return (
    <Main topbar={top}>
      <h1 className="sr-only">Tests</h1>
      <div className={styles.summary}>
        <div className={`${styles.stat} ${styles.ok}`}>
          <div className={styles.k}>Passing</div>
          <div className={styles.v}>{passing}</div>
        </div>
        <div className={`${styles.stat} ${styles.bad}`}>
          <div className={styles.k}>Failing</div>
          <div className={styles.v}>{failing}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.k}>Suites</div>
          <div className={styles.v}>{suites}</div>
        </div>
      </div>
      <div className={ui.panel}>
        <div className={ui.ptitle}>
          Test runs <span className={ui.c}>last {TESTS.length} prototypes</span>
        </div>
        <div>
          <div className={`${styles.trow} ${styles.head}`}>
            <span>Prototype</span>
            <span>Checks</span>
            <span>Result</span>
            <span className={styles.right}>Status</span>
          </div>
          {TESTS.length ? (
            TESTS.map((t) => <TestRow key={t.name} t={t} />)
          ) : (
            <EmptyState
              icon="tests"
              title="No tests"
              description="No test runs have been recorded."
            />
          )}
        </div>
      </div>
    </Main>
  );
}
