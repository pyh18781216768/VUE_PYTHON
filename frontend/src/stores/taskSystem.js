import { defineStore } from "pinia";

import { requestJson } from "@/api/http";

export const useTaskSystemStore = defineStore("taskSystem", {
  state: () => ({
    loading: false,
    handovers: [],
    tasks: [],
    users: [],
    settings: {},
  }),
  actions: {
    async bootstrap() {
      this.loading = true;
      try {
        const payload = await requestJson("/api/task-system/bootstrap");
        this.handovers = payload.handovers || [];
        this.tasks = payload.tasks || [];
        this.users = payload.users || [];
        this.settings = payload.settings || {};
      } finally {
        this.loading = false;
      }
    },
  },
});
