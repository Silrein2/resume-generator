<template>
  <div class="zoom-controls">
    <button
      class="zoom-btn"
      :disabled="modelValue <= min"
      @click="onZoomOut"
      title="Zoom out"
      aria-label="Zoom out"
    >−</button>
    <input
      type="range"
      :min="Math.round(min * 100)"
      :max="Math.round(max * 100)"
      :step="Math.round(step * 100)"
      :value="Math.round(modelValue * 100)"
      @input="onSliderInput"
      class="zoom-slider"
      aria-label="Zoom level"
    />
    <button
      class="zoom-btn"
      :disabled="modelValue >= max"
      @click="onZoomIn"
      title="Zoom in"
      aria-label="Zoom in"
    >+</button>
    <span class="zoom-value">{{ Math.round(modelValue * 100) }}%</span>
    <button class="btn btn--ghost btn--small zoom-reset" @click="$emit('reset')" :title="resetLabel">
      {{ resetLabel }}
    </button>
  </div>
</template>

<script setup>
// Shared zoom UI used by the dashboard preview and the public resume reader.
// Range and step are configurable so each context can choose appropriate bounds.
const props = defineProps({
  modelValue: { type: Number, default: 1 },
  min: { type: Number, default: 0.4 },
  max: { type: Number, default: 1.5 },
  step: { type: Number, default: 0.05 },
  resetLabel: { type: String, default: 'Fit' }
})
const emit = defineEmits(['update:modelValue', 'reset'])

function onZoomIn() {
  emit('update:modelValue', Math.min(props.max, +(props.modelValue + props.step).toFixed(2)))
}
function onZoomOut() {
  emit('update:modelValue', Math.max(props.min, +(props.modelValue - props.step).toFixed(2)))
}
function onSliderInput(e) {
  emit('update:modelValue', parseInt(e.target.value, 10) / 100)
}
</script>

<style scoped>
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zoom-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease;
  flex-shrink: 0;
}
.zoom-btn:hover:not(:disabled) {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}
.zoom-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.zoom-slider {
  flex: 0 0 110px;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}
.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
.zoom-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
.zoom-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-soft);
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.zoom-reset { margin-left: 4px; flex-shrink: 0; }

/* Mobile: shrink slider and hide percentage to save horizontal space */
@media (max-width: 500px) {
  .zoom-slider { flex: 0 0 70px; }
  .zoom-value { display: none; }
  .zoom-controls { gap: 6px; }
}
</style>
