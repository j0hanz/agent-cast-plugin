import { useSyncExternalStore } from 'react';

// ponytail: hand-rolled external store — same useSyncExternalStore primitive
// router.jsx already uses for hash routing. No need for a state-management dep.
const setFilter = (group, val) => setState({ filter: { ...state.filter, [group]: val } });
const setQuery = (group, val) => setState({ query: { ...state.query, [group]: val } });
const setSeg = (group, val) => setState({ seg: { ...state.seg, [group]: val } });

let state = {
  filter: { prototypes: 'All', screenshots: 'All' }, setFilter,
  query: { prototypes: '', screenshots: '' }, setQuery,
  seg: { detail: null, sandbox: null, prototypesTab: 'Prototypes' }, setSeg,
};
const listeners = new Set();
function setState(patch) { state = { ...state, ...patch }; listeners.forEach(l => l()); }
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;

export function useUI(selector) {
  return useSyncExternalStore(subscribe, () => selector(state));
}
