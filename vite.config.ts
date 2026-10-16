import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  // Determine base path for GitHub Pages deployment:
  // 1. In dev server mode, keep '/' for local development
  // 2. In build mode:
  //    - If VITE_BASE or BASE_URL is set, use that
  //    - If GITHUB_REPOSITORY is present (automatically provided by GitHub Actions as 'owner/repo'), use `/${repo}/`
  //    - Fallback to './' which ensures assets load relative to index.html on any custom domain or subpath
  const repoName = process.env.GITHUB_REPOSITORY
    ? process.env.GITHUB_REPOSITORY.split('/')[1]
    : undefined;

  const base =
    command === 'serve'
      ? '/'
      : process.env.VITE_BASE ||
        process.env.BASE_URL ||
        (repoName ? `/${repoName}/` : './');

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
