import { useSyncExternalStore } from 'react';
import { Sidebar } from './layout/Shell.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { useRoute } from './router.ts';

const subscribe = (cb: () => void) => {
  window.addEventListener('live-data-update', cb);
  return () => window.removeEventListener('live-data-update', cb);
};

export default function App() {
  const { active, Component, props } = useRoute();
  useSyncExternalStore(subscribe, () => null);

  return (
    <div className="app">
      <Sidebar active={active} />
      <ErrorBoundary key={active}>
        <Component {...props} />
      </ErrorBoundary>
    </div>
  );
}
