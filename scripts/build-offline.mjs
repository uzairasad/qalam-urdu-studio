import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function bundle() {
  console.log('Building standalone single-file Qalam Urdu Studio Windows application...');
  await build({
    root,
    configFile: false,
    plugins: [react(), tailwindcss(), viteSingleFile()],
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

    // Copy to public/Qalam_Urdu_Studio.html so users can download it directly from the app
    const publicTarget = path.resolve(root, 'public/Qalam_Urdu_Studio.html');
    fs.copyFileSync(sourceHtml, publicTarget);
    console.log('Successfully generated public/Qalam_Urdu_Studio.html');

    // Also copy to root as Qalam_Urdu_Studio.html
    const rootTarget = path.resolve(root, 'Qalam_Urdu_Studio.html');
    fs.copyFileSync(sourceHtml, rootTarget);
    console.log('Successfully generated root Qalam_Urdu_Studio.html');
  }
}

bundle().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
