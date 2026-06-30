import { useState, useEffect } from 'react';
import { Sidebar } from './layout/Shell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { useRoute } from './router.jsx';

export default function App() {
  const { active, Component, props } = useRoute();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('live-data-update', handler);
    return () => window.removeEventListener('live-data-update', handler);
  }, []);

  return (
    <div className="app">
      <Sidebar active={active} />
      <ErrorBoundary key={active}>
        <Component {...props} />
      </ErrorBoundary>
    </div>
  );
}
