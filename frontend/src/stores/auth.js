import { defineStore } from "pinia";

import { requestJson } from "@/api/http";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    checking: false,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    permissionLevel: (state) => Number(state.user?.permissionLevel || 1),
  },
  actions: {
    async loadSession() {
      this.checking = true;
      try {
        const payload = await requestJson("/api/session");
        this.user = payload.authenticated ? payload.user : null;
      } finally {
        this.checking = false;
      }
    },
  },
});
