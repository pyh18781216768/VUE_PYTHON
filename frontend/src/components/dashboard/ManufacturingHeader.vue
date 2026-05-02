<template>
  <header class="manufacturing-header">
    <div class="manufacturing-brand">
      <div class="chip-emblem" aria-hidden="true">
        <span></span>
      </div>
      <div>
        <p>CMA AA</p>
        <h1>CMA AA 製程看板</h1>
      </div>
    </div>

    <div class="circuit-rail" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <nav class="manufacturing-actions" aria-label="全域操作">
      <a class="manufacturing-nav-button ghost" :href="legacyDashboardUrl">
        <span>▣</span>
        舊看板入口
      </a>
    </nav>
  </header>
</template>

<script setup>
const legacyDashboardUrl = "https://www.baidu.com/";
</script>
