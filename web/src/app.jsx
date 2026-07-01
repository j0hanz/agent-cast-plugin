import { useSyncExternalStore } from 'react';
import { Sidebar } from './layout/Shell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { useRoute } from './router.jsx';

const subscribe = (cb) => {
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
