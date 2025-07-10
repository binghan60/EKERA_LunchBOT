<script setup>
import GroupSetting from '@/components/GroupSetting.vue'
import DrawHistoryChart from '@/components/DrawHistoryChart.vue' // 導入圖表組件
import { useRoute } from 'vue-router'
const route = useRoute()
const groupId = route.query.groupId
</script>

<template>
  <main v-if="groupId">
    <GroupSetting :groupId="groupId"></GroupSetting>
    <DrawHistoryChart :groupId="groupId"></DrawHistoryChart>
    <!-- 使用圖表組件 -->
  </main>
  <div v-else>
    <h1>請先透過 LINE Bot 進入設定頁面</h1>
    <p>您可以從 LINE Bot 的「建立群組」或「群組設定」按鈕進入此頁面。</p>
  </div>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Add some space between components */
}
</style>
