// composables/usePdfExport.ts
// Wraps html2pdf.js with sane defaults for A4 resume export.
// Imported dynamically so the ~500kb library doesn't bloat initial bundle.

export async function exportElementToPdf(el: HTMLElement, filename = 'resume.pdf') {
  if (!el) throw new Error('No element to export')
  if (import.meta.server) throw new Error('PDF export is client-only')

  // @ts-ignore - html2pdf.js doesn't ship types
  const { default: html2pdf } = await import('html2pdf.js')

  const opts = {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['css', 'legacy'] }
  }

  return html2pdf().from(el).set(opts).save()
}
