// utils/fonts.ts
// =============================================================================
// Font registry — single source of truth for fonts available in the editors.
//
// To add a new font:
//   1. Add a new entry to FONTS below.
//   2. Set `cssFamily` to the exact font-family string the browser should use
//      (matches what you'd write in CSS).
//   3. Set `googleFontsParam` to the Google Fonts URL fragment, OR set it to
//      `null` if the font is hosted elsewhere or is a system font.
//   4. (Optional) set `defaultFor` to mark this font as a preferred default
//      for one of the contexts.
//
// The font list is loaded into nuxt.config.ts to build the global Google Fonts
// preload URL — no extra build step required.
// =============================================================================

export interface FontDefinition {
  /** Internal id — stored in Firestore. Don't change after a font is in use. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** CSS font-family declaration. Must include fallback. */
  cssFamily: string
  /** Google Fonts URL parameter (everything after `family=`). Null if not from Google. */
  googleFontsParam: string | null
  /** Which contexts is this font a sensible default for? */
  defaultFor?: Array<'resumeDisplay' | 'resumeBody' | 'article'>
  /** Hint to the UI about font character — used for grouping in the dropdown. */
  category: 'serif' | 'sans' | 'mono' | 'display'
}

export const FONTS: FontDefinition[] = [
  // --- Serifs ----------------------------------------------------------------
  {
    id: 'fraunces',
    label: 'Fraunces',
    cssFamily: "'Fraunces', 'Times New Roman', serif",
    googleFontsParam: 'Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700',
    defaultFor: ['resumeDisplay'],
    category: 'serif'
  },
  {
    id: 'lora',
    label: 'Lora',
    cssFamily: "'Lora', Georgia, serif",
    googleFontsParam: 'Lora:wght@400;500;600;700',
    category: 'serif'
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    cssFamily: "'Merriweather', Georgia, serif",
    googleFontsParam: 'Merriweather:wght@300;400;700',
    category: 'serif'
  },
  {
    id: 'crimson',
    label: 'Crimson Pro',
    cssFamily: "'Crimson Pro', Georgia, serif",
    googleFontsParam: 'Crimson+Pro:wght@300;400;500;600;700',
    category: 'serif'
  },

  // --- Sans-serifs -----------------------------------------------------------
  {
    id: 'public-sans',
    label: 'Public Sans',
    cssFamily: "'Public Sans', system-ui, sans-serif",
    googleFontsParam: 'Public+Sans:wght@300;400;500;600;700',
    defaultFor: ['resumeBody', 'article'],
    category: 'sans'
  },
  {
    id: 'inter',
    label: 'Inter',
    cssFamily: "'Inter', system-ui, sans-serif",
    googleFontsParam: 'Inter:wght@300;400;500;600;700',
    category: 'sans'
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    cssFamily: "'Work Sans', system-ui, sans-serif",
    googleFontsParam: 'Work+Sans:wght@300;400;500;600;700',
    category: 'sans'
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    cssFamily: "'DM Sans', system-ui, sans-serif",
    googleFontsParam: 'DM+Sans:wght@400;500;700',
    category: 'sans'
  },

  // --- Monospace -------------------------------------------------------------
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    cssFamily: "'JetBrains Mono', ui-monospace, monospace",
    googleFontsParam: 'JetBrains+Mono:wght@400;500',
    category: 'mono'
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    cssFamily: "'IBM Plex Mono', ui-monospace, monospace",
    googleFontsParam: 'IBM+Plex+Mono:wght@400;500;600',
    category: 'mono'
  },

  // --- Display ---------------------------------------------------------------
  {
    id: 'playfair',
    label: 'Playfair Display',
    cssFamily: "'Playfair Display', Georgia, serif",
    googleFontsParam: 'Playfair+Display:wght@400;500;600;700',
    category: 'display'
  },
  {
    id: 'libre-caslon',
    label: 'Libre Caslon',
    cssFamily: "'Libre Caslon Text', Georgia, serif",
    googleFontsParam: 'Libre+Caslon+Text:wght@400;700',
    category: 'display'
  }
]

/** Get a font definition by id, falling back to the first matching default. */
export function getFont(id: string | undefined | null, context: 'resumeDisplay' | 'resumeBody' | 'article'): FontDefinition {
  if (id) {
    const found = FONTS.find(f => f.id === id)
    if (found) return found
  }
  return FONTS.find(f => f.defaultFor?.includes(context)) || FONTS[0]
}

/** Build the Google Fonts URL that preloads every font in the registry. */
export function buildGoogleFontsUrl(): string {
  const params = FONTS
    .map(f => f.googleFontsParam)
    .filter((p): p is string => !!p)
    .map(p => `family=${p}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}
