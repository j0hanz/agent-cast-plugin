import { Main } from '../layout/Shell.tsx';
import { EmptyState } from '../components/ui.tsx';
import ui from '../components/ui.module.css';

export function NotFound() {
  return (
    <Main topbar={<>Page not found</>}>
      <EmptyState
        icon="search"
        title="Page not found"
        description="That route doesn't exist or has moved."
      />
      <a href="#/prototypes" className={`${ui.chip} ${ui.center}`}>
        Back to prototypes
      </a>
    </Main>
  );
}
