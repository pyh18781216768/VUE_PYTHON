<template>
  <label ref="shellRef" class="field-shell">
    <span v-if="label">{{ label }}</span>
    <input
      v-model="query"
      type="text"
      :placeholder="placeholder"
      @focus="handleFocus"
      @input="openDropdown"
      @keydown.escape="open = false"
    />
    <div
      v-if="open"
      :class="['field-dropdown', dropdownDirection === 'up' ? 'field-dropdown-up' : 'field-dropdown-down']"
    >
      <button
        v-if="allowEmpty"
        type="button"
        :class="{ active: !modelValue }"
        @mousedown.prevent="selectOption(emptyOption)"
      >
        {{ emptyLabel }}
      </button>
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        :class="{ active: String(option.value) === String(modelValue) }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.label }}
      </button>
      <p v-if="!filteredOptions.length">没有匹配选项</p>
    </div>
  </label>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "请输入关键词" },
  allowEmpty: { type: Boolean, default: true },
  emptyLabel: { type: String, default: "全部" },
  clearOnFocus: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const query = ref("");
const shellRef = ref(null);
const dropdownDirection = ref("down");
const emptyOption = { value: "", label: props.emptyLabel };

watch(
  () => [props.modelValue, props.options],
  () => {
    const option = props.options.find((item) => String(item.value) === String(props.modelValue));
    query.value = option?.label || "";
  },
  { immediate: true },
);

const filteredOptions = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return props.options;
  return props.options.filter((option) =>
    [option.label, option.value].some((item) => String(item || "").toLowerCase().includes(keyword)),
  );
});

function handleFocus() {
  if (props.clearOnFocus) query.value = "";
  openDropdown();
}

function openDropdown() {
  open.value = true;
  void updateDropdownDirection();
}

async function updateDropdownDirection() {
  await nextTick();
  const rect = shellRef.value?.getBoundingClientRect();
  if (!rect) return;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  dropdownDirection.value = spaceBelow < 230 && spaceAbove > spaceBelow ? "up" : "down";
}

function selectOption(option) {
  emit("update:modelValue", option.value);
  query.value = option.label;
  open.value = false;
}
</script>
