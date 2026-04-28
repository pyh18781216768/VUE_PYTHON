import { createRouter, createWebHistory } from "vue-router";

import Handover from "@/views/Handover.vue";
import Login from "@/views/Login.vue";
import Operations from "@/views/Operations.vue";
import Settings from "@/views/Settings.vue";
import Tasks from "@/views/Tasks.vue";
import Users from "@/views/Users.vue";
import { requestJson } from "@/api/http";

const standaloneMeta = { standalone: true };
const authMeta = { requiresAuth: true };
const adminMeta = { requiresAuth: true, requiresAdmin: true };
const DashboardParameter = () => import("@/views/DashboardParameter.vue");

const routes = [
  { path: "/", redirect: "/task-system/handover" },
  { path: "/frontend", redirect: "/oc" },
  { path: "/frontend/dashboard", redirect: "/oc" },
  { path: "/frontend/handover", name: "frontend-handover", component: Handover, meta: authMeta },
  { path: "/frontend/tasks", name: "frontend-tasks", component: Tasks, meta: authMeta },
  { path: "/frontend/users", name: "frontend-users", component: Users, meta: adminMeta },
  { path: "/frontend/operations", name: "frontend-operations", component: Operations, meta: adminMeta },
  { path: "/frontend/settings", name: "frontend-settings", component: Settings, meta: adminMeta },
  { path: "/login", name: "login", component: Login, meta: standaloneMeta },
  { path: "/task-system/handover", name: "handover", component: Handover, meta: authMeta },
  { path: "/task-system/tasks", name: "tasks", component: Tasks, meta: authMeta },
  { path: "/task-system/users", name: "users", component: Users, meta: adminMeta },
  { path: "/task-system/operations", name: "operations", component: Operations, meta: adminMeta },
  { path: "/task-system/settings", name: "settings", component: Settings, meta: adminMeta },
  { path: "/angle", name: "angle", component: DashboardParameter, props: { page: "angle" }, meta: authMeta },
  { path: "/oc", name: "oc", component: DashboardParameter, props: { page: "oc" }, meta: authMeta },
  { path: "/lens", name: "lens", component: DashboardParameter, props: { page: "lens" }, meta: authMeta },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const session = await requestJson("/api/session").catch(() => ({ authenticated: false }));
  if (!session.authenticated) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && Number(session.user?.permissionLevel || 1) < 5) {
    return { path: "/task-system/handover" };
  }
  return true;
});

export default router;
