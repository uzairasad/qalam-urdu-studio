import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { woff2Only } from './woff2-only.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function bundle() {
  console.log('Building the single-file offline Qalam Urdu Studio (Qalam_Urdu_Studio.html)...');
  await build({
    root,
    configFile: false,
    plugins: [react(), tailwindcss(), woff2Only(), viteSingleFile()],
    resolve: {
      alias: {
        '@': root,
      },
    },
    build: {
      outDir: 'dist-standalone',
      emptyOutDir: true,
      cssCodeSplit: false,
    },
  });

  const sourceHtml = path.resolve(root, 'dist-standalone/index.html');
  if (fs.existsSync(sourceHtml)) {
    let html = fs.readFileSync(sourceHtml, 'utf8');
    const iconSvgPath = path.resolve(root, 'public/icon.svg');
    if (fs.existsSync(iconSvgPath)) {
      const svgBase64 = fs.readFileSync(iconSvgPath).toString('base64');
      html = html.replace(
        /href="\.?\/icon\.svg"/gi,
        `href="data:image/svg+xml;base64,${svgBase64}"`
      );
    }
    html = html.replace(/<link[^>]*href="\.?\/apple-touch-icon\.png"[^>]*>\s*/gi, '');
    html = html.replace(/<link[^>]*href="\.?\/favicon\.ico"[^>]*>\s*/gi, '');
    fs.writeFileSync(sourceHtml, html, 'utf8');

    // Into dist/ (built just before this by `vite build`), where the web app's "Download
    // Single-File App" button fetches it. Written here rather than kept in public/ so it is
    // always this build's copy, and so the native app bundles don't carry it.
    const distTarget = path.resolve(root, 'dist/Qalam_Urdu_Studio.html');
    if (fs.existsSync(path.dirname(distTarget))) {
      fs.copyFileSync(sourceHtml, distTarget);
      console.log('Generated dist/Qalam_Urdu_Studio.html');
    }
  }
}

bundle().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
