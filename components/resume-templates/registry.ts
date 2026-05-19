// components/resume-templates/registry.ts
// =============================================================================
// Resume template registry.
//
// To add a new template:
//   1. Create a new Vue file under `components/resume-templates/`.
//      The component receives a single `resume` prop with the full resume data.
//      Theme CSS variables (--rt-display-font, --rt-accent, etc.) are applied
//      on the parent .a4-page wrapper, so the template just uses them.
//   2. Add an entry to TEMPLATES below.
//   3. Drop a thumbnail SVG in /public/templates/ matching the id.
//   4. Wire the component into ResumeView.vue's dispatch map.
//
// The `supports` flags control which colour pickers are shown in the editor
// for a given template — e.g. Classic has no sidebar so `sidebarBg` is hidden.
// =============================================================================

export type TemplateId = 'editorial' | 'classic' | 'profile' | 'manifest'

export interface TemplateDefinition {
  /** Stable id stored in Firestore. Never change once shipped. */
  id: TemplateId
  /** Shown in the picker. */
  name: string
  /** One-line description shown below the name. */
  description: string
  /** Path to the schematic SVG (in /public/templates/). */
  thumbnail: string
  /** Which theme features this template actually uses. Controls which
   *  colour pickers are visible in the editor's Style card. */
  supports: {
    photo: boolean       // template displays the profile image
    headerBg: boolean    // template has a distinct header zone with its own bg
    sidebarBg: boolean   // template has a sidebar with its own bg
    photoBg: boolean     // template has a photo cell with a separate bg
  }
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style 15% / 15% grid. Photo, header strip, sidebar, main.',
    thumbnail: '/templates/editorial.svg',
    supports: { photo: true, headerBg: true, sidebarBg: true, photoBg: true }
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Single-column traditional CV. No photo, no sidebar — ATS-friendly.',
    thumbnail: '/templates/classic.svg',
    supports: { photo: false, headerBg: false, sidebarBg: false, photoBg: false }
  },
  {
    id: 'profile',
    name: 'Profile',
    description: 'Photo and lists in a tall left sidebar; main content on the right.',
    thumbnail: '/templates/profile.svg',
    supports: { photo: true, headerBg: false, sidebarBg: true, photoBg: false }
  },
  {
    id: 'manifest',
    name: 'Manifest',
    description: 'Minimalist single column. Generous whitespace, name in display type.',
    thumbnail: '/templates/manifest.svg',
    supports: { photo: false, headerBg: false, sidebarBg: false, photoBg: false }
  }
]

export const DEFAULT_TEMPLATE_ID: TemplateId = 'editorial'

export function getTemplate(id: string | undefined | null): TemplateDefinition {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}
