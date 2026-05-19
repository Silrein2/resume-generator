// utils/resume-helpers.ts
// Small utilities shared across resume templates.

/**
 * Normalize a sidebar section's items to a clean array of strings, dropping
 * empty lines and trimming whitespace. Handles both shapes:
 *   - editor state: { itemsText: 'a\nb\nc' }  (raw textarea buffer)
 *   - saved data:   { items: ['a', 'b', 'c'] }
 */
export function cleanItems(section: { itemsText?: string; items?: string[] } | undefined | null): string[] {
  if (!section) return []
  const raw = section.itemsText != null
    ? section.itemsText
    : (section.items || []).join('\n')
  return raw.split('\n').map(l => l.trim()).filter(Boolean)
}

/**
 * Build a single human-readable contact line for templates that don't use the
 * vertical contact list. Joins available fields with a middle-dot separator.
 */
export function contactLine(resume: { email?: string; phone?: string; location?: string }): string {
  return [resume.phone, resume.email, resume.location].filter(Boolean).join('  ·  ')
}

/** Initials from a full name, capped at two characters. */
export function initialsOf(name: string | undefined | null): string {
  const n = (name || '').trim()
  if (!n) return '·'
  return n.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
}
