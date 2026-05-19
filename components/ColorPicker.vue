<template>
  <div class="field color-picker-field">
    <label v-if="label">{{ label }}</label>
    <div class="swatches">
      <button
        v-for="c in palette"
        :key="c.value"
        type="button"
        class="swatch"
        :class="{ active: isEqual(c.value, modelValue) }"
        :style="{ background: c.value, color: contrastInk(c.value) }"
        :title="c.label"
        @click="$emit('update:modelValue', c.value)"
      >
        <span v-if="isEqual(c.value, modelValue)" class="check">✓</span>
      </button>
      <label class="swatch swatch--custom" :title="'Custom color'">
        <input
          type="color"
          :value="hexOf(modelValue)"
          @input="$emit('update:modelValue', $event.target.value)"
          class="color-input"
        />
        <span class="custom-mark">+</span>
      </label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  // Array of { value: '#hex', label: 'name' }
  palette: { type: Array, required: true }
})
defineEmits(['update:modelValue'])

function isEqual(a, b) {
  return (a || '').toLowerCase() === (b || '').toLowerCase()
}

// The native <input type="color"> only accepts 6-digit hex. Coerce.
function hexOf(val) {
  if (!val) return '#000000'
  const m = /^#([0-9a-f]{6})$/i.exec(val.trim())
  return m ? '#' + m[1] : '#000000'
}

// Pick a contrasting ink color for the checkmark on a swatch.
function contrastInk(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return '#000'
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff
  // Perceived luminance (Rec. 709)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.55 ? '#1a1d24' : '#ffffff'
}
</script>

<style scoped>
.color-picker-field { margin-bottom: 0; }
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.swatch {
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 120ms ease, border-color 120ms ease;
  position: relative;
}
.swatch:hover { transform: scale(1.08); }
.swatch.active { border-color: var(--ink); border-width: 2px; }
.check { font-size: 12px; font-weight: 700; line-height: 1; }

.swatch--custom {
  background:
    linear-gradient(45deg, transparent 45%, #ccc 45%, #ccc 55%, transparent 55%),
    linear-gradient(135deg, transparent 45%, #ccc 45%, #ccc 55%, transparent 55%),
    linear-gradient(white, white);
  position: relative;
  overflow: hidden;
}
.custom-mark {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  pointer-events: none;
}
.color-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}
</style>
