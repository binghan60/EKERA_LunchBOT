<script setup>
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()
</script>

<template>
  <div v-if="groupStore.imageModal.show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="groupStore.closeImageModal">
    <div class="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-95" :class="{ 'scale-100': groupStore.imageModal.show }" @click.stop>
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-xl font-semibold text-amber-800">{{ groupStore.imageModal.restaurant?.name }} - 菜單</h3>
        <button @click="groupStore.closeImageModal" class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"><i class="fa-solid fa-times fa-lg"></i></button>
      </div>
      <div class="p-4 overflow-y-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <img v-for="(image, index) in groupStore.imageModal.restaurant?.menu" :key="index" :src="image" :alt="`菜單 ${index + 1}`" class="w-full h-auto object-cover rounded-lg border" />
        </div>
      </div>
    </div>
  </div>
</template>
