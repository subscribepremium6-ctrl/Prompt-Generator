// icons.js — Darkroom's own icon set.
// Every icon shares the same construction rules: 1.75px stroke, rounded
// joins, a 24x24 grid, and a small solid dot used as the only "filled"
// accent across the whole set (echoing an equipment indicator light).
// This keeps the icon language consistent without borrowing any existing
// icon pack's silhouettes.

const ICONS = {
  aperture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="8.4"/>
    <path d="M12 6.2 15 12l-3 5.8M12 6.2 9 12l3 5.8M6.6 9.5h10.8M6.6 14.5h10.8" opacity="0"/>
    <path d="M12 3.6v3.1M20.4 12h-3.1M12 20.4v-3.1M3.6 12h3.1M17.7 6.3l-2.2 2.2M17.7 17.7l-2.2-2.2M6.3 17.7l2.2-2.2M6.3 6.3l2.2 2.2"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
  </svg>`,

  filmstrip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3.2" y="4.5" width="17.6" height="15" rx="1.6"/>
    <line x1="3.2" y1="9" x2="20.8" y2="9"/>
    <line x1="3.2" y1="15" x2="20.8" y2="15"/>
    <circle cx="6.2" cy="6.7" r="0.6" fill="currentColor" stroke="none"/>
    <circle cx="6.2" cy="17.3" r="0.6" fill="currentColor" stroke="none"/>
    <circle cx="17.8" cy="6.7" r="0.6" fill="currentColor" stroke="none"/>
    <circle cx="17.8" cy="17.3" r="0.6" fill="currentColor" stroke="none"/>
  </svg>`,

  dial: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="7.8"/>
    <path d="M12 7.4v4.6l3.2 2"/>
    <circle cx="12" cy="4.2" r="1.1" fill="currentColor" stroke="none"/>
  </svg>`,

  tray: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3.5 14.5h17l-2 5h-13z"/>
    <path d="M3.5 14.5 6.8 5h10.4l3.3 9.5"/>
  </svg>`,

  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3.6c.6 3.4 2 5.6 4.8 6.9-2.8 1.3-4.2 3.5-4.8 6.9-.6-3.4-2-5.6-4.8-6.9 2.8-1.3 4.2-3.5 4.8-6.9Z"/>
    <circle cx="19" cy="18.4" r="1.1" fill="currentColor" stroke="none"/>
  </svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8.7" y="8.7" width="10.6" height="10.6" rx="1.4"/>
    <path d="M15.3 8.7V6.3a1.4 1.4 0 0 0-1.4-1.4H6.3a1.4 1.4 0 0 0-1.4 1.4v7.6a1.4 1.4 0 0 0 1.4 1.4h2.4"/>
  </svg>`,

  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6.5 4.6h11v14.8l-5.5-3.6-5.5 3.6Z"/>
  </svg>`,

  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12a7 7 0 0 1 11.9-5"/>
    <path d="M19 12a7 7 0 0 1-11.9 5"/>
    <path d="M16.9 4.6v3.2h-3.2M7.1 19.4v-3.2h3.2"/>
  </svg>`,

  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.7 12S6 6 12 6s9.3 6 9.3 6-3.3 6-9.3 6-9.3-6-9.3-6Z"/>
    <circle cx="12" cy="12" r="2.4"/>
  </svg>`,

  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4l16 16"/>
    <path d="M10.6 6.3A9.7 9.7 0 0 1 12 6c6 0 9.3 6 9.3 6a13.7 13.7 0 0 1-3.1 3.7M7.4 7.9C4.9 9.5 2.7 12 2.7 12s3.3 6 9.3 6a9.1 9.1 0 0 0 2.9-.5"/>
    <path d="M9.9 10.1a2.4 2.4 0 0 0 3.4 3.4"/>
  </svg>`,

  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 7.3h14M9.5 7.3V5.1h5v2.2M8 7.3l.7 12.1a1.4 1.4 0 0 0 1.4 1.3h3.8a1.4 1.4 0 0 0 1.4-1.3L16 7.3"/>
  </svg>`,

  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>
  </svg>`,

  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 4.3 21 19.4H3Z"/>
    <line x1="12" y1="10" x2="12" y2="14"/>
    <circle cx="12" cy="16.7" r="0.6" fill="currentColor" stroke="none"/>
  </svg>`,

  loupe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10.3" cy="10.3" r="6.3"/>
    <line x1="15" y1="15" x2="20.5" y2="20.5"/>
  </svg>`,

  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5.5 8.5 12 15l6.5-6.5"/>
  </svg>`,
};

function icon(name, className = '') {
  const svg = ICONS[name] || '';
  return svg.replace('<svg ', `<svg class="icon ${className}" `);
}

window.Darkroom = window.Darkroom || {};
window.Darkroom.icon = icon;
