<template>
  <label class="file-upload-field">
    <span>{{ label }}</span>
    <div class="file-upload-control">
      <input
        class="file-upload-input"
        type="text"
        readonly
        :title="displayValue"
        :value="displayValue"
        @click="openPicker"
      />
      <button class="ghost-button" type="button" @click="openPicker">選擇附件</button>
      <input
        ref="fileInputRef"
        class="file-upload-native"
        type="file"
        multiple
        @change="handleFileChange"
      />
    </div>
  </label>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  files: { type: Array, default: () => [] },
  label: { type: String, default: "附件上傳" },
});

const emit = defineEmits(["file-change"]);

const fileInputRef = ref(null);

const displayValue = computed(() => {
  if (!props.files.length) return "未上傳任何附件";
  return props.files.map((file) => file.name).join("、");
});

watch(
  () => props.files.length,
  (length) => {
    if (length === 0 && fileInputRef.value) fileInputRef.value.value = "";
  },
);

function openPicker() {
  fileInputRef.value?.click();
}

function handleFileChange(event) {
  emit("file-change", event);
  if (fileInputRef.value) fileInputRef.value.value = "";
}
</script>
