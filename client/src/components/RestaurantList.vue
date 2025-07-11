<script setup>
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()

const emit = defineEmits(['dragstart', 'dragend'])

function handleDragStart(restaurant) {
  emit('dragstart', restaurant)
}

function handleDragEnd() {
  emit('dragend')
}
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
      <h3 class="text-xl font-semibold text-amber-800">所有餐廳清單</h3>
    </div>
    <div class="max-h-[500px] overflow-y-auto p-1 -mr-2 pr-2">
      <div v-if="groupStore.restaurants.length === 0" class="text-amber-800 text-center py-8">尚無餐廳資料</div>
      <div v-else class="space-y-3">
        <div v-for="r in groupStore.restaurants" :key="r._id" draggable="true" @dragstart="handleDragStart(r)" @dragend="handleDragEnd" class="p-3 bg-amber-50 border border-amber-300 rounded-lg cursor-move hover:bg-amber-100">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img v-if="r.menu && r.menu.length > 0" :src="r.menu[0]" alt="菜單" class="w-full sm:w-20 sm:h-20 h-40 object-cover rounded-md border border-amber-300 shadow cursor-pointer" @click="groupStore.openImageModal(r)" />
            <div v-else class="w-full sm:w-20 h-20 bg-amber-100 rounded-md border border-amber-300 flex items-center justify-center text-xs text-amber-600 text-center">無菜單</div>
            <div class="flex-1 min-w-0">
              <div class="text-amber-900 font-bold">{{ r.name }}</div>
              <div class="text-sm text-amber-700 mt-1">
                <div v-if="r.address" class="flex items-center">
                  <i class="fa-solid fa-location-dot fa-fw mr-2"></i>
                  <span>{{ r.address }}</span>
                </div>
                <div v-if="r.phone" class="flex items-center">
                  <i class="fa-solid fa-phone fa-fw mr-2"></i>
                  <span>{{ r.phone }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button @click="groupStore.openEditModal(r._id, $event)" class="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow" aria-label="編輯"><i class="fa-solid fa-pencil cursor-pointer"></i></button>
              <button @click="groupStore.deleteRestaurant(r._id)" class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 shadow" aria-label="刪除"><i class="fa-solid fa-trash cursor-pointer"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
