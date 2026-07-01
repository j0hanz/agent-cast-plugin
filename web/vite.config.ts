import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base:'' → relative asset paths, so `vite preview` / static hosting work from any path.
export default defineConfig({
  plugins: [react()],
  base: '',
});
