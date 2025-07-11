<script setup>
import { ref } from 'vue'
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()
const newOffice = ref('')

const handleAddOffice = () => {
  groupStore.addOffice(newOffice.value)
  newOffice.value = ''
}
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50 duration-300 hover:shadow-xl hover:-translate-y-1">
    <h3 class="text-xl font-semibold text-amber-800 mb-4">管理辦公室</h3>
    <div class="flex flex-col sm:flex-row gap-3 w-full">
      <input v-model="newOffice" type="text" placeholder="輸入新辦公室名稱" class="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-amber-900 placeholder-amber-600" />
      <button @click="handleAddOffice" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md flex-shrink-0 cursor-pointer">新增辦公室</button>
    </div>
    <p class="text-sm text-amber-600 mt-2">為您的群組新增不同辦公室地點以便綁定餐廳。</p>
  </div>
</template>
