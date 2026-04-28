<template>
  <ModalDialog :open="Boolean(user)" title="使用者詳情" eyebrow="Detail" @close="$emit('close')">
    <dl class="detail-grid">
      <template v-for="item in detailRows" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </template>
    </dl>
  </ModalDialog>
</template>

<script setup>
import { computed } from "vue";

import ModalDialog from "@/components/ModalDialog.vue";

const props = defineProps({
  formatDateTime: { type: Function, required: true },
  roleLabel: { type: Function, required: true },
  user: { type: Object, default: null },
});

defineEmits(["close"]);

const detailRows = computed(() => {
  const user = props.user || {};
  return [
    { label: "ID", value: valueOrEmpty(user.id) },
    { label: "工號", value: valueOrEmpty(user.username) },
    { label: "姓名", value: valueOrEmpty(user.displayLabel || user.displayName) },
    { label: "職位", value: props.roleLabel(user.role) },
    { label: "權限等級", value: valueOrEmpty(user.permissionLevel) },
    { label: "部門", value: valueOrEmpty(user.department) },
    { label: "主管", value: valueOrEmpty(user.supervisorLabel || user.supervisorUser) },
    { label: "郵箱", value: valueOrEmpty(user.email) },
    { label: "電話", value: valueOrEmpty(user.phone) },
    { label: "建立時間", value: props.formatDateTime(user.createdAt) },
    { label: "更新時間", value: props.formatDateTime(user.updatedAt) },
  ];
});

function valueOrEmpty(value) {
  return value === null || value === undefined || value === "" ? "--" : String(value);
}
</script>
