<template>
  <div class="field font-picker-field" :class="{ inline }">
    <label v-if="label">{{ label }}</label>
    <div class="font-picker-wrap">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="select font-picker-select"
        :style="{ fontFamily: currentFamily }"
        :aria-label="label || 'Font'"
      >
        <optgroup v-for="group in groups" :key="group.label" :label="group.label">
          <option
            v-for="f in group.fonts"
            :key="f.id"
            :value="f.id"
            :style="{ fontFamily: f.cssFamily }"
          >{{ f.label }}</option>
        </optgroup>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FONTS, getFont } from '~/utils/fonts'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  context: { type: String, default: 'article' }, // 'resumeDisplay' | 'resumeBody' | 'article'
  inline: { type: Boolean, default: false }
})
defineEmits(['update:modelValue'])

// Show currently selected font's family on the closed <select> too, so the user
// sees the font even before opening the dropdown.
const currentFamily = computed(() => getFont(props.modelValue, props.context).cssFamily)

// Group fonts by category for the optgroup structure. This makes long lists
// scannable as more fonts are added.
const groups = computed(() => {
  const order = ['serif', 'sans', 'display', 'mono']
  const labels = { serif: 'Serif', sans: 'Sans-serif', display: 'Display', mono: 'Monospace' }
  return order
    .map(cat => ({ label: labels[cat], fonts: FONTS.filter(f => f.category === cat) }))
    .filter(g => g.fonts.length)
})
</script>

<style scoped>
.font-picker-field { margin-bottom: 0; }
.font-picker-field.inline { display: flex; flex-direction: column; gap: 4px; }
.font-picker-wrap { display: flex; }
.font-picker-select {
  width: 100%;
  font-size: 14px;
}
/* Note: most browsers only honor the <option> font-family when the dropdown is open;
   the closed display always uses the <select>'s font. The :style binding on the
   <select> ensures the closed state previews the selected font, which is the goal. */
</style>
