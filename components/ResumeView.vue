<template>
  <div class="a4-stage" ref="stageRef">
    <div class="a4-page themed" ref="pageRef" :style="themeStyle">
      <component :is="templateComponent" :resume="resume" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getFont } from '~/utils/fonts'
import { getTemplate } from '~/components/resume-templates/registry'

import EditorialTemplate from '~/components/resume-templates/EditorialTemplate.vue'
import ClassicTemplate from '~/components/resume-templates/ClassicTemplate.vue'
import ProfileTemplate from '~/components/resume-templates/ProfileTemplate.vue'
import ManifestTemplate from '~/components/resume-templates/ManifestTemplate.vue'

const props = defineProps({
  resume: { type: Object, required: true }
})

const stageRef = ref(null)
const pageRef = ref(null)

// Dispatch table — keys must match the `id` field in registry.ts.
const TEMPLATE_COMPONENTS = {
  editorial: EditorialTemplate,
  classic: ClassicTemplate,
  profile: ProfileTemplate,
  manifest: ManifestTemplate
}

const templateDefinition = computed(() => getTemplate(props.resume.templateId))
const templateComponent = computed(() => TEMPLATE_COMPONENTS[templateDefinition.value.id] || EditorialTemplate)

// Resolve theme values, falling back to design defaults. We apply them as
// inline CSS custom properties on the page wrapper; every template reads them
// via var(--rt-*) so the theme system is shared across all templates.
const themeStyle = computed(() => {
  const t = props.resume.theme || {}
  return {
    '--rt-display-font': getFont(t.displayFont, 'resumeDisplay').cssFamily,
    '--rt-body-font': getFont(t.bodyFont, 'resumeBody').cssFamily,
    '--rt-accent': t.accent || '#7a4f3a',
    '--rt-paper': t.paper || '#ffffff',
    '--rt-ink': t.ink || '#1a1d24',
    '--rt-header-bg': t.headerBg || '#f3eee5',
    '--rt-sidebar-bg': t.sidebarBg || '#ece6da',
    '--rt-photo-bg': t.photoBg || '#2a2722'
  }
})

defineExpose({ stageRef, pageRef })
</script>

<style scoped>
/* The wrapper just hosts the theme custom properties; layout lives in
   each template component. Width/height inherited from .a4-page in main.css. */
.a4-page.themed {
  background: var(--rt-paper);
}
</style>
