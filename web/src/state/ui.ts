import { useSyncExternalStore } from 'react';
import type { Device } from '../data/types.ts';

interface FilterState {
  prototypes: string;
  screenshots: string;
}
interface QueryState {
  prototypes: string;
  screenshots: string;
}
interface SegState {
  detail: Device | null;
  sandbox: Device | null;
  prototypesTab: 'Prototypes' | 'Screenshots';
}

interface UIState {
  filter: FilterState;
  setFilter: (group: keyof FilterState, val: string) => void;
  query: QueryState;
  setQuery: (group: keyof QueryState, val: string) => void;
  seg: SegState;
  setSeg: <K extends keyof SegState>(group: K, val: SegState[K]) => void;
}

// ponytail: hand-rolled external store — same useSyncExternalStore primitive
// router.tsx already uses for hash routing. No need for a state-management dep.
const setFilter = (group: keyof FilterState, val: string) =>
  setState({ filter: { ...state.filter, [group]: val } });
const setQuery = (group: keyof QueryState, val: string) =>
  setState({ query: { ...state.query, [group]: val } });
const setSeg = <K extends keyof SegState>(group: K, val: SegState[K]) =>
  setState({ seg: { ...state.seg, [group]: val } });

let state: UIState = {
  filter: { prototypes: 'All', screenshots: 'All' },
  setFilter,
  query: { prototypes: '', screenshots: '' },
  setQuery,
  seg: { detail: null, sandbox: null, prototypesTab: 'Prototypes' },
  setSeg,
};
const listeners = new Set<() => void>();
function setState(patch: Partial<UIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useUI<T>(selector: (state: UIState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}
