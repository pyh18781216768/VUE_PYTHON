<template>
  <ModalDialog :open="Boolean(record)" :title="title" eyebrow="Detail" @close="$emit('close')">
    <div v-if="record" class="detail-sections">
      <section v-for="section in sections" :key="section.title" class="detail-section">
        <h3>{{ section.title }}</h3>
        <dl class="detail-grid">
          <template v-for="item in section.fields" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd :class="{ 'detail-long': item.long }">{{ item.value }}</dd>
          </template>
        </dl>
      </section>
      <section class="detail-section">
        <h3>附件</h3>
        <AttachmentList :attachments="record.attachments || []" @preview="$emit('preview', $event)" />
      </section>
    </div>
  </ModalDialog>
</template>

<script setup>
import { computed } from "vue";

import ModalDialog from "@/components/ModalDialog.vue";
import AttachmentList from "@/components/handover/AttachmentList.vue";

const props = defineProps({
  formatDateTime: { type: Function, required: true },
  record: { type: Object, default: null },
});

defineEmits(["close", "preview"]);

const title = computed(() => (props.record ? `交接班詳情 #${props.record.id}` : "交接班詳情"));

const sections = computed(() => {
  const record = props.record || {};
  return [
    {
      title: "基礎資訊",
      fields: [
        { label: "ID", value: valueOrEmpty(record.id) },
        { label: "關鍵詞", value: valueOrEmpty(record.keywords), long: true },
        { label: "樓層", value: valueOrEmpty(record.floorName) },
        { label: "交班班次", value: valueOrEmpty(record.shiftName) },
        { label: "接班班次", value: valueOrEmpty(record.receiverShiftName) },
        { label: "建立時間", value: props.formatDateTime(record.createdAt || record.recordTime) },
        { label: "更新時間", value: props.formatDateTime(record.updatedAt) },
        { label: "建立人", value: valueOrEmpty(record.createdBy) },
      ],
    },
    {
      title: "交接人員",
      fields: [
        { label: "交班人", value: valueOrEmpty(record.handoverUser) },
        { label: "接班人", value: valueOrEmpty(record.receiverUser) },
        { label: "接班人主管", value: valueOrEmpty(record.receiverSupervisorLabel) },
        { label: "@人員", value: valueOrEmpty(record.mentionUserLabels), long: true },
      ],
    },
    {
      title: "交接內容",
      fields: [
        { label: "當班情況", value: valueOrEmpty(record.workSummary), long: true },
        { label: "注意事項", value: valueOrEmpty(record.precautions), long: true },
        { label: "未完成事項", value: valueOrEmpty(record.pendingItems), long: true },
      ],
    },
  ];
});

function valueOrEmpty(value) {
  return value === null || value === undefined || value === "" ? "--" : String(value);
}
</script>
