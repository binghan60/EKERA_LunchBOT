<script setup>
import { onMounted } from 'vue'
import GroupSettingsPanel from '@/components/GroupSettingsPanel.vue'
import DrawHistoryChart from '@/components/DrawHistoryChart.vue'
import { useRoute } from 'vue-router'
import { useGroupStore } from '@/stores/group'

const route = useRoute()
const groupStore = useGroupStore()

const groupIdFromRoute = route.query.groupId

onMounted(() => {
  if (groupIdFromRoute) {
    groupStore.setGroupId(groupIdFromRoute)
    groupStore.initializeGroupData()
  }
})
</script>

<template>
  <main v-if="groupStore.groupId">
    <GroupSettingsPanel></GroupSettingsPanel>
    <DrawHistoryChart :groupId="groupStore.groupId"></DrawHistoryChart>
  </main>
  <div v-else class="flex items-center justify-center min-h-screen bg-amber-50 p-4">
    <div class="bg-white p-8 rounded-2xl shadow-lg border border-amber-200/50 text-center max-w-xl">
      <h1 class="text-3xl font-bold text-amber-800 mb-4">請先透過 LINE Bot 進入設定頁面</h1>
      <p class="text-amber-700 text-lg">您可以從 LINE Bot 的「建立群組」或「群組設定」按鈕進入此頁面。</p>
    </div>
  </div>
</template>
