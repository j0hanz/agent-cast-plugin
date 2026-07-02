import { memo, useCallback, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Main } from '../layout/Shell.tsx';
import { AgentPill, Chips, EmptyState, Panel } from '../components/ui.tsx';
import { useUI, setFilter } from '../state/ui.ts';
import {
  SESSIONS,
  filterSessions,
  pendingSessions,
  deriveAgent,
  relativeTime,
  SCREENSHOTS,
  MCP_CALLS,
} from '../data/data.ts';
import { validateField } from '../data/sessionSchema.ts';
import type { SessionField, SessionQuestion } from '../data/types.ts';
import ui from '../components/ui.module.css';
import styles from './Sessions.module.css';

type Answers = Record<string, unknown>;
type Overrides = Record<string, { answers: Answers; answeredAt: string }>;

const answerText = (f: SessionField): string => {
  if (f.answer == null) return '—';
  if (Array.isArray(f.answer)) return f.answer.length ? f.answer.join(', ') : '—';
  if (typeof f.answer === 'boolean') return f.answer ? 'Yes' : 'No';
  return String(f.answer);
};

const AnsweredField = memo(({ f }: { f: SessionField }) => (
  <div className={ui.kv}>
    <span className={ui.k}>{f.label}</span>
    <span className={ui.v}>{answerText(f)}</span>
  </div>
));

interface ControlProps {
  field: SessionField;
  value: unknown;
  error?: string;
  onChange: (v: unknown) => void;
  onBlur: () => void;
}

// One switch, not five components — every field type shares the same
// label/error chrome and only the control itself varies.
const FieldControl = memo(({ field, value, error, onChange, onBlur }: ControlProps) => {
  const domId = useId();
  const labelId = `${domId}-label`;
  const errId = `${domId}-err`;
  const described = error ? errId : undefined;

  let control: ReactNode;
  switch (field.type) {
    case 'text':
      control = (
        <input
          id={domId}
          type="text"
          className={styles.input}
          value={(value as string | undefined) ?? ''}
          maxLength={field.maxLength}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
    case 'textarea':
      control = (
        <textarea
          id={domId}
          className={styles.textarea}
          value={(value as string | undefined) ?? ''}
          maxLength={field.maxLength}
          rows={3}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
    case 'number':
      control = (
        <input
          id={domId}
          type="number"
          className={styles.input}
          value={(value as string | undefined) ?? ''}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
    case 'select':
      control = (
        <select
          id={domId}
          className={styles.select}
          value={(value as string | undefined) ?? ''}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Choose…
          </option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case 'multiselect': {
      const selected = (value as string[] | undefined) ?? [];
      control = (
        <div
          className={styles.checks}
          role="group"
          aria-labelledby={labelId}
          aria-describedby={described}
        >
          {field.options.map((o) => (
            <label key={o} className={styles.checkItem}>
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, o]
                    : selected.filter((v) => v !== o);
                  onChange(next);
                  onBlur();
                }}
              />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'boolean':
      control = (
        <label className={styles.toggle}>
          <input
            type="checkbox"
            role="switch"
            checked={(value as boolean | undefined) ?? false}
            aria-labelledby={labelId}
            onChange={(e) => {
              onChange(e.target.checked);
              onBlur();
            }}
          />
          <span className={styles.track} aria-hidden="true" />
          <span className={styles.toggleLabel}>
            {(value as boolean | undefined) ? 'Yes' : 'No'}
          </span>
        </label>
      );
      break;
    case 'date':
      control = (
        <input
          id={domId}
          type="date"
          className={styles.input}
          value={(value as string | undefined) ?? ''}
          aria-labelledby={labelId}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
      break;
  }

  return (
    <div className={styles.field}>
      <span className={styles.label} id={labelId}>
        {field.label}
      </span>
      {control}
      {error && (
        <span id={errId} className={styles.err} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

interface SessionCardProps {
  q: SessionQuestion;
  onAnswer: (id: string, answers: Answers, answeredAt: string) => void;
}

// A checkbox always has a concrete boolean state the moment it renders — there
// is no "empty" toggle — so it defaults to false rather than starting
// undefined, which z.boolean() would otherwise (correctly) reject.
const initialValues = (fields: SessionField[]): Answers =>
  Object.fromEntries(fields.filter((f) => f.type === 'boolean').map((f) => [f.id, false]));

const SessionCard = memo(({ q, onAnswer }: SessionCardProps) => {
  const [values, setValues] = useState<Answers>(() => initialValues(q.fields));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (q.status === 'answered') {
    return (
      <Panel title={q.header} count={<span className={`${ui.pill} ${ui.passed}`}>Answered</span>}>
        <p className={styles.prompt}>{q.prompt}</p>
        <span className={styles.meta}>Answered {relativeTime(q.answeredAt ?? q.ts)}</span>
        <div className={styles.answers}>
          {q.fields.map((f) => (
            <AnsweredField key={f.id} f={f} />
          ))}
        </div>
      </Panel>
    );
  }

  const change = (field: SessionField, v: unknown) => {
    setValues((s) => ({ ...s, [field.id]: v }));
    if (touched[field.id]) setErrors((s) => ({ ...s, [field.id]: validateField(field, v) }));
  };
  const blur = (field: SessionField) => {
    setTouched((s) => ({ ...s, [field.id]: true }));
    setErrors((s) => ({ ...s, [field.id]: validateField(field, values[field.id]) }));
  };
  const submit = () => {
    const nextErrors: Record<string, string | undefined> = {};
    const nextTouched: Record<string, boolean> = {};
    let valid = true;
    for (const f of q.fields) {
      const msg = validateField(f, values[f.id]);
      nextErrors[f.id] = msg;
      nextTouched[f.id] = true;
      if (msg) valid = false;
    }
    setErrors(nextErrors);
    setTouched(nextTouched);
    if (valid) onAnswer(q.id, values, new Date().toISOString());
  };
  // Gates the button live (an incomplete form can't be submitted) regardless
  // of touched state — visible per-field error text still waits for
  // blur/submit so untouched fields aren't red before the user acts.
  const allValid = q.fields.every((f) => !validateField(f, values[f.id]));

  return (
    <Panel title={q.header} count={<span className={`${ui.pill} ${ui.live}`}>Pending</span>}>
      <p className={styles.prompt}>{q.prompt}</p>
      <span className={styles.meta}>Asked {relativeTime(q.ts)}</span>
      <div className={styles.fields}>
        {q.fields.map((f) => (
          <FieldControl
            key={f.id}
            field={f}
            value={values[f.id]}
            error={touched[f.id] ? errors[f.id] : undefined}
            onChange={(v) => change(f, v)}
            onBlur={() => blur(f)}
          />
        ))}
      </div>
      <button type="button" className={styles.submit} onClick={submit} disabled={!allValid}>
        Submit answer
      </button>
    </Panel>
  );
});

export function Sessions() {
  const filter = useUI((s) => s.filter.sessions) ?? 'All';
  const [overrides, setOverrides] = useState<Overrides>({});

  // Values were already Zod-validated against each field's own schema before
  // onAnswer fired — the cast at this one seam is honest, not a gap to close.
  const merged = useMemo(
    () =>
      SESSIONS.map((q): SessionQuestion => {
        const o = overrides[q.id];
        if (!o) return q;
        return {
          ...q,
          status: 'answered',
          answeredAt: o.answeredAt,
          fields: q.fields.map((f) => ({ ...f, answer: o.answers[f.id] }) as SessionField),
        };
      }),
    [overrides],
  );

  const list = filterSessions(filter, merged);
  const pending = pendingSessions(merged);

  const handleAnswer = useCallback((id: string, answers: Answers, answeredAt: string) => {
    setOverrides((s) => ({ ...s, [id]: { answers, answeredAt } }));
  }, []);

  const top = (
    <>
      <div className="grow" />
      <AgentPill {...deriveAgent(SCREENSHOTS, MCP_CALLS)} />
    </>
  );

  return (
    <Main topbar={top}>
      <div className={ui.dhead}>
        <h1>Sessions</h1>
        <span className={`${ui.pill} ${pending ? ui.live : ui.passed}`}>
          {pending ? `${pending} pending` : 'All answered'}
        </span>
      </div>
      <div className={ui.toolbar}>
        <Chips
          labels={['All', 'Pending', 'Answered']}
          value={filter}
          onChange={useCallback((v: string) => setFilter('sessions', v), [])}
        />
        <div className="grow" />
        <span className={ui.count}>{list.length} questions</span>
      </div>
      {list.length ? (
        <div className={styles.feed}>
          {list.map((q) => (
            <SessionCard key={q.id} q={q} onAnswer={handleAnswer} />
          ))}
        </div>
      ) : merged.length ? (
        <EmptyState title="No matching questions" description="Try a different filter." />
      ) : (
        <EmptyState
          icon="sessions"
          title="No questions yet"
          description="The agent hasn't asked anything this session."
        />
      )}
    </Main>
  );
}
