import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { requestJson } from "@/api/http";
import {
  installActiveLoginWindowCleanup,
  isOtherActiveLoginWindow,
  startActiveLoginWindowHeartbeat,
} from "./loginWindowRegistry";

const DEFAULT_REDIRECT = "/task-system/handover";

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function resolveRedirectTarget(route) {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect;
  if (!redirect || !String(redirect).startsWith("/") || String(redirect).startsWith("/login")) {
    return DEFAULT_REDIRECT;
  }
  return String(redirect);
}

export function useLogin() {
  const router = useRouter();
  const route = useRoute();
  const checking = ref(true);
  const submitting = ref(false);
  const message = ref("");
  const form = reactive({
    username: "",
    password: "",
  });

  const redirectTarget = computed(() => resolveRedirectTarget(route));

  function showConflictMessage() {
    message.value = "此帳號已在其他視窗登入，不能重複開啟。";
  }

  function startHeartbeat(username) {
    return startActiveLoginWindowHeartbeat(username, () => {
      showConflictMessage();
      router.replace("/login").catch(() => {});
    });
  }

  async function checkExistingSession() {
    checking.value = true;
    try {
      const session = await requestJson("/api/session").catch(() => ({ authenticated: false }));
      if (session.authenticated) {
        startHeartbeat(session.user?.username);
        await router.replace(redirectTarget.value);
      }
    } finally {
      checking.value = false;
    }
  }

  async function login() {
    const loginUsername = normalizeUsername(form.username);
    message.value = "";
    if (!loginUsername || !form.password) {
      message.value = "請輸入工號和密碼。";
      return false;
    }
    if (isOtherActiveLoginWindow(loginUsername)) {
      showConflictMessage();
      return false;
    }

    submitting.value = true;
    try {
      const payload = await requestJson("/api/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!startHeartbeat(payload.user?.username || loginUsername)) {
        showConflictMessage();
        return false;
      }
      await router.replace(redirectTarget.value);
      return true;
    } catch (error) {
      message.value = error instanceof Error ? error.message : String(error);
      return false;
    } finally {
      submitting.value = false;
    }
  }

  onMounted(() => {
    installActiveLoginWindowCleanup();
    void checkExistingSession();
  });

  return {
    checking,
    form,
    login,
    message,
    redirectTarget,
    submitting,
  };
}
