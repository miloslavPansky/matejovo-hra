import { defineConfig } from 'vite';

const sha = process.env.GITHUB_SHA ? `+${process.env.GITHUB_SHA.slice(0, 7)}` : '+local';

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/<repo>/) and locally.
  base: './',
  server: {
    // File change events do not cross the Windows -> container mount (WSLC), so poll there.
    watch: process.env.VITE_POLL === '1' ? { usePolling: true, interval: 300 } : undefined,
  },
  define: {
    __APP_VERSION__: JSON.stringify(`${process.env.npm_package_version ?? '0.0.0'}${sha}`),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});
