<template>
  <ModalDialog
    :open="open"
    :title="isEditing ? '編輯任務' : '建立與分配任務'"
    eyebrow="Task"
    @close="$emit('close')"
  >
    <form class="settings-form task-form" @submit.prevent="$emit('submit')">
      <label>
        <span>任務標題</span>
        <input v-model.trim="form.title" type="text" placeholder="例如：跟進異常參數" />
      </label>
      <SearchableSelect
        v-model="form.status"
        class="search-field"
        label="狀態"
        :options="statusOptions"
        :allow-empty="false"
      />
      <SearchableSelect
        v-model="form.priority"
        class="search-field"
        label="優先級"
        :options="priorityOptions"
        :allow-empty="false"
      />
      <SearchableSelect
        v-model="form.assigneeUser"
        class="search-field"
        label="負責人"
        :options="userOptions"
        empty-label="未分配"
      />
      <MultiSearchableSelect
        v-model="form.mentionUsers"
        class="form-span-all"
        label="@人員"
        :options="mentionUserOptions"
        placeholder="搜尋並選擇需要 @ 的人員，可多選"
      />
      <label>
        <span>開始時間</span>
        <input v-model="form.startAt" type="datetime-local" />
      </label>
      <label>
        <span>到期時間</span>
        <input v-model="form.dueAt" type="datetime-local" />
      </label>
      <SearchableSelect
        v-model="form.handoverRecordId"
        class="search-field form-span-all"
        label="關聯交接班記錄"
        :options="handoverOptions"
        empty-label="不關聯"
      />
      <label class="form-span-all">
        <span>任務說明</span>
        <textarea v-model.trim="form.description" rows="5" placeholder="輸入任務背景、處理步驟與要求"></textarea>
      </label>
      <label class="form-span-all">
        <span>附件上傳</span>
        <input :key="fileInputKey" type="file" multiple @change="$emit('file-change', $event)" />
      </label>
      <p v-if="files.length" class="subtle-text form-span-all">已選擇 {{ files.length }} 個附件</p>
      <p v-if="message" :class="['inline-message form-span-all', messageTone === 'success' ? 'inline-success' : 'inline-error']">
        {{ message }}
      </p>
      <div class="form-actions form-span-all">
        <button v-if="isEditing" class="danger-button" type="button" :disabled="submitting" @click="$emit('delete')">
          刪除
        </button>
        <button v-else class="ghost-button" type="button" :disabled="submitting" @click="$emit('reset')">
          重置
        </button>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? "儲存中..." : "儲存任務" }}
        </button>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import { computed } from "vue";

import ModalDialog from "@/components/ModalDialog.vue";
import MultiSearchableSelect from "@/components/base/MultiSearchableSelect.vue";
import SearchableSelect from "@/components/base/SearchableSelect.vue";

defineEmits(["close", "delete", "file-change", "reset", "submit"]);

const props = defineProps({
  files: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  handoverOptions: { type: Array, default: () => [] },
  isEditing: { type: Boolean, default: false },
  mentionUserOptions: { type: Array, default: () => [] },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  priorityOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  userOptions: { type: Array, default: () => [] },
});

const fileInputKey = computed(() => `${props.open}-${props.files.length}`);
</script>
