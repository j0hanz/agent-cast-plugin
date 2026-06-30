import { Main } from '../layout/Shell.jsx';
import { EmptyState } from '../components/ui.jsx';
import ui from '../components/ui.module.css';

export function NotFound() {
  return (
    <Main topbar={<>Page not found</>}>
      <EmptyState icon="search" title="Page not found"
        description="That route doesn't exist or has moved." />
      <a href="#/prototypes" className={ui.chip} style={{ alignSelf: 'center' }}>Back to prototypes</a>
    </Main>
  );
}
