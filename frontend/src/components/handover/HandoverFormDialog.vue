<template>
  <ModalDialog
    :open="open"
    :title="isEditing ? '編輯交接班記錄' : '建立交接班記錄'"
    eyebrow="Handover"
    @close="$emit('close')"
  >
    <form class="settings-form handover-form" @submit.prevent="$emit('submit')">
      <SearchableSelect
        v-model="form.shiftGroupId"
        class="search-field"
        label="班次"
        :options="shiftOptions"
        empty-label="請選擇"
      />
      <SearchableSelect
        v-model="form.floorId"
        class="search-field"
        label="樓層"
        :options="floorOptions"
        empty-label="請選擇"
      />
      <SearchableSelect
        v-model="form.receiverUser"
        class="search-field"
        label="接班人"
        :options="userOptions"
        empty-label="請選擇"
      />
      <label>
        <span>關鍵詞</span>
        <input v-model.trim="form.keywords" type="text" placeholder="工單、設備、風險點" />
      </label>
      <MultiSearchableSelect
        v-model="form.mentionUsers"
        class="form-span-all"
        label="@人員"
        :options="mentionUserOptions"
        placeholder="搜尋並選擇需要 @ 的人員，可多選"
      />
      <label class="form-span-all">
        <span>當班情況</span>
        <textarea v-model.trim="form.workSummary" rows="4" placeholder="記錄本班運行情況"></textarea>
      </label>
      <label>
        <span>注意事項</span>
        <textarea v-model.trim="form.precautions" rows="4" placeholder="需要關注的事項"></textarea>
      </label>
      <label>
        <span>未完成事項</span>
        <textarea v-model.trim="form.pendingItems" rows="4" placeholder="待接班繼續跟進"></textarea>
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
          {{ submitting ? "儲存中..." : "儲存交接記錄" }}
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
  floorOptions: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
  mentionUserOptions: { type: Array, default: () => [] },
  message: { type: String, default: "" },
  messageTone: { type: String, default: "success" },
  open: { type: Boolean, default: false },
  shiftOptions: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  userOptions: { type: Array, default: () => [] },
});

const fileInputKey = computed(() => `${props.open}-${props.files.length}`);
</script>
