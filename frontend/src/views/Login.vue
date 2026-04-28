<template>
  <main class="login-page">
    <section class="login-card">
      <p class="page-kicker">AA Task Gateway</p>
      <h1>AA 看板任務登入介面</h1>
      <p class="login-subtitle">請使用工號和密碼登入任務看板系統。</p>

      <div v-if="checking" class="login-state">
        <span class="legacy-spinner"></span>
        <span>正在檢查登入狀態...</span>
      </div>

      <form v-else class="login-form" @submit.prevent="login">
        <label>
          <span>工號</span>
          <input v-model.trim="form.username" type="text" autocomplete="username" placeholder="例如：admin" />
        </label>
        <label>
          <span>密碼</span>
          <input v-model="form.password" type="password" autocomplete="current-password" placeholder="請輸入密碼" />
        </label>
        <p v-if="message" class="inline-message inline-error">{{ message }}</p>
        <button class="primary-button login-submit" type="submit" :disabled="submitting">
          {{ submitting ? "登入中..." : "登入" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { useLogin } from "@/composables/auth/useLogin";

const { checking, form, login, message, submitting } = useLogin();
</script>
