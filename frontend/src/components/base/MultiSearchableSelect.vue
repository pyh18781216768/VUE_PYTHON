<template>
  <label ref="shellRef" class="field-shell multi-field-shell">
    <span v-if="label">{{ label }}</span>
    <div class="multi-select-control" :class="{ focused: open }" @click="focusInput">
      <span v-for="item in selectedOptions" :key="item.value" class="multi-select-token">
        {{ item.label }}
        <button type="button" aria-label="移除" @click.stop="removeOption(item.value)">×</button>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="selectedOptions.length ? '' : placeholder"
        @focus="openDropdown"
        @input="openDropdown"
        @keydown.escape="open = false"
      />
    </div>
    <div
      v-if="open"
      :class="['field-dropdown', dropdownDirection === 'up' ? 'field-dropdown-up' : 'field-dropdown-down']"
    >
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.label }}
      </button>
      <p v-if="!filteredOptions.length">沒有匹配選項</p>
    </div>
  </label>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "搜尋並選擇，可多選" },
});
const emit = defineEmits(["update:modelValue"]);

const inputRef = ref(null);
const shellRef = ref(null);
const open = ref(false);
const query = ref("");
const dropdownDirection = ref("down");

const selectedValues = computed(() => new Set((props.modelValue || []).map((item) => String(item))));

const selectedOptions = computed(() =>
  (props.modelValue || []).map((value) => {
    const option = props.options.find((item) => String(item.value) === String(value));
    return option || { value, label: value };
  }),
);

const filteredOptions = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return props.options.filter((option) => {
    if (selectedValues.value.has(String(option.value))) return false;
    if (!keyword) return true;
    return [option.label, option.value].some((item) => String(item || "").toLowerCase().includes(keyword));
  });
});

watch(
  () => props.modelValue,
  () => {
    query.value = "";
  },
);

function focusInput() {
  inputRef.value?.focus();
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
  emit("update:modelValue", [...(props.modelValue || []), option.value]);
  query.value = "";
  open.value = false;
  void nextTick(() => inputRef.value?.focus());
}

function removeOption(value) {
  emit(
    "update:modelValue",
    (props.modelValue || []).filter((item) => String(item) !== String(value)),
  );
}
</script>
