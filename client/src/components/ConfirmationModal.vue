<script setup>
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()
</script>

<template>
  <div v-if="groupStore.confirmModal.show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="groupStore.closeConfirmModal">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col scale-95" :class="{ 'scale-100': groupStore.confirmModal.show }" @click.stop>
      <div class="p-6 text-center">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i class="fa-solid fa-triangle-exclamation text-2xl text-red-600"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-800">{{ groupStore.confirmModal.title }}</h3>
        <p class="text-gray-600 mt-2 whitespace-pre-line">{{ groupStore.confirmModal.message }}</p>
      </div>
      <div class="flex justify-center gap-4 p-4 bg-gray-50 rounded-b-xl">
        <button @click="groupStore.closeConfirmModal" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer">取消</button>
        <button @click="groupStore.handleConfirm" :disabled="groupStore.confirmModal.isConfirming" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium cursor-pointer">
          {{ groupStore.confirmModal.isConfirming ? '處理中...' : '確定' }}
        </button>
      </div>
    </div>
  </div>
</template>
