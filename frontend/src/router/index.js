import { createRouter, createWebHistory } from "vue-router";

import Handover from "@/views/Handover.vue";
import Login from "@/views/Login.vue";
import ManufacturingHome from "@/views/ManufacturingHome.vue";
import Operations from "@/views/Operations.vue";
import Settings from "@/views/Settings.vue";
import Tasks from "@/views/Tasks.vue";
import Users from "@/views/Users.vue";
import { requestJson } from "@/api/http";

const standaloneMeta = { standalone: true };
const authMeta = { requiresAuth: true };
const dashboardHomeMeta = { requiresAuth: true, dashboardHome: true };
const adminMeta = { requiresAuth: true, requiresAdmin: true };
const DashboardParameter = () => import("@/views/DashboardParameter.vue");

const routes = [
  { path: "/", name: "home", component: ManufacturingHome, meta: dashboardHomeMeta },
  { path: "/frontend", redirect: "/" },
  { path: "/frontend/dashboard", redirect: "/" },
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

let cachedSession = null;

export function setAuthenticatedSession(user) {
  cachedSession = { authenticated: Boolean(user), user: user || null };
}

export function clearAuthenticatedSession() {
  cachedSession = null;
}

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;
  const session =
    cachedSession?.authenticated
      ? cachedSession
      : await requestJson("/api/session").catch(() => ({ authenticated: false }));
  cachedSession = session.authenticated ? session : null;
  if (!session.authenticated) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && Number(session.user?.permissionLevel || 1) < 5) {
    return { path: "/" };
  }
  return true;
});

export default router;
