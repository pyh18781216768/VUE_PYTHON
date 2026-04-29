<template>
  <label ref="shellRef" class="field-shell">
    <span v-if="label">{{ label }}</span>
    <input
      v-model="query"
      type="text"
      autocomplete="off"
      spellcheck="false"
      :placeholder="placeholder"
      @focus="handleFocus"
      @input="openDropdown"
      @keydown.escape="closeDropdown"
    />
    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        :class="[
          'field-dropdown',
          'field-dropdown-floating',
          dropdownDirection === 'up' ? 'field-dropdown-up' : 'field-dropdown-down',
        ]"
        :style="dropdownStyle"
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
        <p v-if="!filteredOptions.length">沒有匹配選項</p>
      </div>
    </Teleport>
  </label>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  label: { type: String, default: "" },
  placeholder: { type: String, default: "請輸入關鍵詞" },
  allowEmpty: { type: Boolean, default: true },
  emptyLabel: { type: String, default: "全部" },
  clearOnFocus: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const query = ref("");
const shellRef = ref(null);
const dropdownRef = ref(null);
const dropdownDirection = ref("down");
const dropdownStyle = ref({});
const emptyOption = { value: "", label: props.emptyLabel };
let listenersBound = false;

watch(
  () => [props.modelValue, props.options],
  () => {
    const option = props.options.find((item) => String(item.value) === String(props.modelValue));
    query.value = option?.label || "";
  },
  { immediate: true },
);

watch(open, (isOpen) => {
  if (isOpen) {
    bindFloatingListeners();
    void updateDropdownPosition();
  } else {
    unbindFloatingListeners();
  }
});

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
  void updateDropdownPosition();
}

function closeDropdown() {
  open.value = false;
}

async function updateDropdownPosition() {
  await nextTick();
  const rect = shellRef.value?.getBoundingClientRect();
  if (!rect) return;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;
  const direction = spaceBelow < 230 && spaceAbove > spaceBelow ? "up" : "down";
  const availableSpace = Math.max(120, direction === "up" ? spaceAbove - 16 : spaceBelow - 16);
  dropdownDirection.value = direction;
  dropdownStyle.value = {
    left: `${Math.max(12, rect.left)}px`,
    width: `${rect.width}px`,
    maxHeight: `${Math.min(240, availableSpace)}px`,
    ...(direction === "up"
      ? { bottom: `${viewportHeight - rect.top + 6}px`, top: "auto" }
      : { top: `${rect.bottom + 6}px`, bottom: "auto" }),
  };
}

function selectOption(option) {
  emit("update:modelValue", option.value);
  query.value = option.label;
  open.value = false;
}

function bindFloatingListeners() {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  window.addEventListener("resize", updateDropdownPosition);
  window.addEventListener("scroll", updateDropdownPosition, true);
}

function unbindFloatingListeners() {
  if (!listenersBound) return;
  listenersBound = false;
  document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
  window.removeEventListener("resize", updateDropdownPosition);
  window.removeEventListener("scroll", updateDropdownPosition, true);
}

function handleDocumentPointerDown(event) {
  const target = event.target;
  if (shellRef.value?.contains(target) || dropdownRef.value?.contains(target)) return;
  closeDropdown();
}

onBeforeUnmount(unbindFloatingListeners);
</script>
