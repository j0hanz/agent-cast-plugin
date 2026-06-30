import { Sidebar } from './layout/Shell.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { useRoute } from './router.jsx';

export default function App() {
  const { active, Component, props } = useRoute();
  return (
    <div className="app">
      <Sidebar active={active} />
      <ErrorBoundary key={active}>
        <Component {...props} />
      </ErrorBoundary>
    </div>
  );
}
