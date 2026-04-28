<template>
  <ModalDialog :open="Boolean(task)" :title="title" eyebrow="Detail" @close="$emit('close')">
    <div v-if="task" class="detail-sections">
      <section v-for="section in sections" :key="section.title" class="detail-section">
        <h3>{{ section.title }}</h3>
        <dl class="detail-grid">
          <template v-for="item in section.fields" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd :class="{ 'detail-long': item.long }">{{ item.value }}</dd>
          </template>
        </dl>
      </section>
      <section v-if="task.reviewSubmission" class="detail-section">
        <h3>審核提交</h3>
        <dl class="detail-grid">
          <dt>提交人</dt>
          <dd>{{ valueOrEmpty(task.reviewSubmission.submitterUser) }}</dd>
          <dt>提交時間</dt>
          <dd>{{ formatDateTime(task.reviewSubmission.submittedAt) }}</dd>
          <dt>內容</dt>
          <dd class="detail-long">{{ valueOrEmpty(task.reviewSubmission.content) }}</dd>
          <dt>評分人</dt>
          <dd class="detail-long">{{ valueOrEmpty(task.reviewSubmission.reviewerLabels) }}</dd>
          <dt>平均分</dt>
          <dd>{{ task.reviewSubmission.averageScore ?? "--" }}</dd>
          <dt>等級</dt>
          <dd>{{ valueOrEmpty(task.reviewSubmission.grade) }}</dd>
        </dl>
        <AttachmentList :attachments="task.reviewSubmission.attachments || []" @preview="$emit('preview', $event)" />
      </section>
      <section class="detail-section">
        <h3>任務附件</h3>
        <AttachmentList :attachments="task.attachments || []" @preview="$emit('preview', $event)" />
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
  getHandoverRecordLabel: { type: Function, required: true },
  task: { type: Object, default: null },
});

defineEmits(["close", "preview"]);

const title = computed(() => (props.task ? `任務詳情 #${props.task.id}` : "任務詳情"));

const sections = computed(() => {
  const task = props.task || {};
  return [
    {
      title: "基礎資訊",
      fields: [
        { label: "ID", value: valueOrEmpty(task.id) },
        { label: "標題", value: valueOrEmpty(task.title), long: true },
        { label: "狀態", value: valueOrEmpty(task.status) },
        { label: "優先級", value: valueOrEmpty(task.priority) },
        { label: "負責人", value: valueOrEmpty(task.assigneeUser) },
        { label: "發布者", value: valueOrEmpty(task.creatorUser) },
        { label: "主管", value: valueOrEmpty(task.supervisorLabel) },
        { label: "@人員", value: valueOrEmpty(task.mentionUserLabels), long: true },
      ],
    },
    {
      title: "時間與關聯",
      fields: [
        { label: "建立時間", value: props.formatDateTime(task.createdAt) },
        { label: "更新時間", value: props.formatDateTime(task.updatedAt) },
        { label: "開始時間", value: props.formatDateTime(task.startAt) },
        { label: "到期時間", value: props.formatDateTime(task.dueAt) },
        { label: "完成時間", value: props.formatDateTime(task.completedAt) },
        { label: "關聯交接班", value: props.getHandoverRecordLabel(task.handoverRecordId), long: true },
      ],
    },
    {
      title: "任務內容",
      fields: [
        { label: "說明", value: valueOrEmpty(task.description), long: true },
        { label: "駁回理由", value: valueOrEmpty(task.rejectReason), long: true },
        { label: "駁回人", value: valueOrEmpty(task.rejectedBy) },
        { label: "駁回時間", value: props.formatDateTime(task.rejectedAt) },
      ],
    },
  ];
});

function valueOrEmpty(value) {
  return value === null || value === undefined || value === "" ? "--" : String(value);
}
</script>
