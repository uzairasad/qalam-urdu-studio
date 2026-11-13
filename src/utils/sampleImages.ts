/**
 * Built-in offline-safe architectural & editorial vector illustrations
 * encoded as SVG data URIs so Picture Boxes always render in offline
 * portable HTML and PWA deployments.
 */

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_ASSEMBLY_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="65%" stop-color="#4a7c9b"/>
      <stop offset="100%" stop-color="#d9cbb3"/>
    </linearGradient>
    <linearGradient id="marble" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <!-- Distant Margalla Hills -->
  <path d="M0 245 Q90 205 180 232 T360 220 T520 235 L600 225 L600 290 L0 290 Z" fill="#2d4a5e" opacity="0.7"/>
  <!-- Foreground Courtyard -->
  <rect x="0" y="285" width="600" height="115" fill="#334155"/>
  <rect x="0" y="285" width="600" height="8" fill="#94a3b8"/>
  <!-- Main Assembly Building -->
  <rect x="105" y="165" width="390" height="120" fill="url(#marble)" stroke="#64748b" stroke-width="2"/>
  <!-- Central Dome & Pediment -->
  <path d="M225 165 Q300 95 375 165 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
  <rect x="297" y="92" width="6" height="28" fill="#166534"/>
  <rect x="303" y="94" width="28" height="18" fill="#15803d"/>
  <rect x="303" y="94" width="7" height="18" fill="#ffffff"/>
  <!-- Columns -->
  <g fill="#64748b">
    <rect x="130" y="180" width="12" height="90"/>
    <rect x="160" y="180" width="12" height="90"/>
    <rect x="190" y="180" width="12" height="90"/>
    <rect x="220" y="180" width="12" height="90"/>
    <rect x="250" y="180" width="12" height="90"/>
    <rect x="338" y="180" width="12" height="90"/>
    <rect x="368" y="180" width="12" height="90"/>
    <rect x="398" y="180" width="12" height="90"/>
    <rect x="428" y="180" width="12" height="90"/>
    <rect x="458" y="180" width="12" height="90"/>
  </g>
  <!-- Grand Entrance Arch -->
  <path d="M276 285 L276 215 Q300 190 324 215 L324 285 Z" fill="#0f2942"/>
  <!-- Steps -->
  <rect x="180" y="285" width="240" height="10" fill="#cbd5e1"/>
  <rect x="160" y="295" width="280" height="10" fill="#94a3b8"/>
  <!-- Reflecting Pool -->
  <rect x="195" y="325" width="210" height="55" rx="4" fill="#1e40af" opacity="0.65" stroke="#93c5fd" stroke-width="2"/>
</svg>
`);

export const SAMPLE_MINAR_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="55%" stop-color="#9a3412"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sunset)"/>
  <circle cx="450" cy="110" r="42" fill="#fde68a" opacity="0.85"/>
  <!-- Park Lawn -->
  <rect x="0" y="330" width="600" height="70" fill="#14532d"/>
  <!-- Base Platform -->
  <polygon points="170,340 430,340 400,295 200,295" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
  <!-- Minar Petals & Tower -->
  <path d="M265 295 Q280 230 288 110 L312 110 Q320 230 335 295 Z" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
  <ellipse cx="300" cy="110" rx="18" ry="8" fill="#cbd5e1" stroke="#334155" stroke-width="1.5"/>
  <path d="M286 105 Q300 72 314 105 Z" fill="#e2e8f0" stroke="#334155" stroke-width="1.5"/>
  <line x1="300" y1="60" x2="300" y2="85" stroke="#fde68a" stroke-width="3"/>
</svg>
`);

export const SAMPLE_BOOKS_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1e293b"/>
  <!-- Bookshelf -->
  <rect x="40" y="30" width="520" height="340" fill="#451a03" stroke="#78350f" stroke-width="6"/>
  <rect x="55" y="135" width="490" height="12" fill="#78350f"/>
  <rect x="55" y="255" width="490" height="12" fill="#78350f"/>
  <!-- Top Shelf Books -->
  <rect x="70" y="48" width="26" height="87" fill="#991b1b" rx="2"/>
  <rect x="100" y="55" width="22" height="80" fill="#1e3a8a" rx="2"/>
  <rect x="126" y="45" width="30" height="90" fill="#065f46" rx="2"/>
  <rect x="160" y="58" width="24" height="77" fill="#92400e" rx="2"/>
  <rect x="190" y="50" width="28" height="85" fill="#3730a3" rx="2"/>
  <rect x="224" y="46" width="26" height="89" fill="#b45309" rx="2"/>
  <rect x="255" y="54" width="22" height="81" fill="#831843" rx="2"/>
  <!-- Open Manuscript in foreground -->
  <path d="M160 315 Q230 285 300 310 Q370 285 440 315 L440 375 Q370 350 300 370 Q230 350 160 375 Z" fill="#fef3c7" stroke="#b45309" stroke-width="3"/>
  <line x1="300" y1="310" x2="300" y2="370" stroke="#b45309" stroke-width="2"/>
</svg>
`);

export const SAMPLE_EMBLEM_SVG = encodeSvg(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#064e3b"/>
  <rect x="24" y="24" width="552" height="352" fill="none" stroke="#fbbf24" stroke-width="4"/>
  <rect x="36" y="36" width="528" height="328" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="8 4"/>
  <circle cx="300" cy="200" r="110" fill="#065f46" stroke="#fbbf24" stroke-width="4"/>
  <circle cx="300" cy="200" r="92" fill="none" stroke="#fde68a" stroke-width="1.5"/>
  <!-- Crescent & Star -->
  <path d="M315 155 A48 48 0 1 0 335 235 A38 38 0 1 1 315 155 Z" fill="#fbbf24"/>
  <polygon points="340,175 346,190 362,190 349,199 354,214 340,205 326,214 331,199 318,190 334,190" fill="#fbbf24"/>
</svg>
`);

export const OFFLINE_SAMPLE_IMAGES = [
  { name: 'Parliament / Assembly', url: SAMPLE_ASSEMBLY_SVG },
  { name: 'Minar-e-Pakistan', url: SAMPLE_MINAR_SVG },
  { name: 'Classical Library', url: SAMPLE_BOOKS_SVG },
  { name: 'Official Emblem', url: SAMPLE_EMBLEM_SVG },
];
