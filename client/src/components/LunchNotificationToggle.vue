<script setup>
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50 duration-300 hover:shadow-xl hover:-translate-y-1">
    <h3 class="text-xl font-semibold text-amber-800 mb-4">午餐通知</h3>
    <div class="flex items-center justify-between w-full">
      <label class="inline-flex items-center cursor-pointer flex-grow">
        <input type="checkbox" v-model="groupStore.groupSetting.lunchNotification" @change="groupStore.saveGroupSetting" class="sr-only peer" />
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600 dark:peer-checked:bg-amber-600"></div>
        <span class="ms-3 text-base font-medium text-amber-700">
          {{ groupStore.groupSetting.lunchNotification ? '開啟午餐通知' : '關閉午餐通知' }}
        </span>
      </label>
    </div>
    <p class="text-sm text-amber-600 mt-2">啟用後，將於每日 11:25 自動推播隨機餐廳。</p>
  </div>
</template>
