import { useSyncExternalStore, useEffect } from 'react';
import type { ComponentType } from 'react';
import { NAV, SYSTEM, PROTOTYPES } from './data/data.ts';
import { Prototypes } from './views/Prototypes.tsx';
import { Detail } from './views/Detail.tsx';
import { Sandbox } from './views/Sandbox.tsx';
import { Tests } from './views/Tests.tsx';
import { System } from './views/System.tsx';
import { NotFound } from './views/NotFound.tsx';

const ROUTES: Record<string, ComponentType> = {
  prototypes: Prototypes,
  sandbox: Sandbox,
  tests: Tests,
  system: System,
};

const subscribe = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const getSnapshot = () => window.location.hash;

function useHashRoute() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// L5: map route id -> human label for document.title updates
const NAV_LABELS: Record<string, string> = Object.fromEntries([...NAV, ...SYSTEM].map(n => [n.id, n.label]));

// Component/props are inherently dynamic here (Detail takes {id}, the rest
// take none) — `any`/unknown-record is the honest type for a route table
// dispatched by string id, not a gap to close with a discriminated union.
export interface RouteMatch {
  active: string | null;
  Component: ComponentType<any>;
  props: Record<string, unknown>;
}

// Returns { active: navId-to-highlight, Component, props }.
export function useRoute(): RouteMatch {
  const hash = useHashRoute();
  const [seg0, seg1] = (hash.replace(/^#\/?/, '') || 'prototypes').split('/');

  let active: string | null;
  let Component: ComponentType<any>;
  let props: Record<string, unknown> = {};
  if (seg0 === 'prototype' && seg1) {
    active = 'prototypes'; Component = Detail; props = { id: seg1 };
  } else if (seg0 && ROUTES[seg0]) {
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
