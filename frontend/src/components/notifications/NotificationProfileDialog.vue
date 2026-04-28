<template>
  <ModalDialog :open="open" title="个人信息" eyebrow="Profile" @close="$emit('close')">
    <dl class="detail-grid">
      <dt>工号</dt>
      <dd>{{ user?.username || "--" }}</dd>
      <dt>姓名</dt>
      <dd>{{ user?.displayLabel || user?.displayName || "--" }}</dd>
      <dt>部门</dt>
      <dd>{{ user?.department || "--" }}</dd>
      <dt>主管</dt>
      <dd>{{ user?.supervisorLabel || "--" }}</dd>
      <dt>邮箱</dt>
      <dd>{{ user?.email || "--" }}</dd>
      <dt>电话</dt>
      <dd>{{ user?.phone || "--" }}</dd>
    </dl>
  </ModalDialog>
</template>

<script setup>
import ModalDialog from "@/components/ModalDialog.vue";

defineEmits(["close"]);

defineProps({
  open: { type: Boolean, default: false },
  user: { type: Object, default: null },
});
</script>
