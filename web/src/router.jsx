import { useSyncExternalStore, useEffect } from 'react';
import { NAV, SYSTEM, PROTOTYPES } from './data/data.js';
import { Prototypes } from './views/Prototypes.jsx';
import { Detail } from './views/Detail.jsx';
import { Sandbox } from './views/Sandbox.jsx';
import { Tests } from './views/Tests.jsx';
import { System } from './views/System.jsx';
import { NotFound } from './views/NotFound.jsx';

const ROUTES = {
  prototypes: Prototypes,
  sandbox: Sandbox,
  tests: Tests,
  system: System,
};

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const getSnapshot = () => window.location.hash;

function useHashRoute() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// L5: map route id -> human label for document.title updates
const NAV_LABELS = Object.fromEntries([...NAV, ...SYSTEM].map(n => [n.id, n.label]));

// Returns { active: navId-to-highlight, Component, props }.
export function useRoute() {
  const hash = useHashRoute();
  const [seg0, seg1] = (hash.replace(/^#\/?/, '') || 'prototypes').split('/');

  let active, Component, props = {};
  if (seg0 === 'prototype' && seg1) {
    active = 'prototypes'; Component = Detail; props = { id: seg1 };
  } else if (ROUTES[seg0]) {
    active = seg0; Component = ROUTES[seg0];
  } else {
    active = null; Component = NotFound; // unknown route -> 404 (empty hash already resolves to 'prototypes')
  }

  // L5: keep browser tab title in sync with the active route
  useEffect(() => {
    let label;
    if (seg0 === 'prototype' && seg1) {
      const p = PROTOTYPES.find(x => x.id === seg1);
      label = p ? `${p.name} — Prototype — AgentCast` : 'Prototype — AgentCast';
    } else {
      label = active ? `${NAV_LABELS[active]} — AgentCast` : 'Page not found — AgentCast';
    }
    document.title = label;
  }, [active, seg0, seg1]);

  return { active, Component, props };
}
