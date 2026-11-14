// Vite plugin: the bundled @fontsource fonts list a .woff fallback after each .woff2. Every
// browser and webview Qalam supports reads woff2, so the fallbacks are dead weight (about half
// the font bytes) in the installers, the APK and the single-file offline HTML. This drops them.

// A file URL (normal build) or an inlined data: URI (single-file build).
const WOFF_FALLBACK =
  /,\s*url\(\s*["']?(?:[^)"']+\.woff|data:font\/woff;base64,[^)"']+)["']?\s*\)\s*format\(\s*["']woff["']\s*\)/g;

export function woff2Only() {
  return {
    name: 'qalam:woff2-only',
    generateBundle: {
      // After the single-file plugin, which inlines the CSS into index.html.
      order: 'post',
      handler(_options, bundle) {
        for (const file of Object.values(bundle)) {
          if (file.type === 'asset' && /\.(css|html)$/.test(file.fileName) && typeof file.source === 'string') {
            file.source = file.source.replace(WOFF_FALLBACK, '');
          }
        }
        const text = Object.values(bundle)
          .map((f) => (f.type === 'chunk' ? f.code : typeof f.source === 'string' ? f.source : ''))
          .join('\n');
        for (const name of Object.keys(bundle)) {
          if (name.endsWith('.woff') && !text.includes(name.split('/').pop())) delete bundle[name];
        }
      },
    },
  };
}
