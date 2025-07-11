<script setup>
import { ref, watch, nextTick } from 'vue'
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()

const restaurantNameInput = ref(null)

watch(() => groupStore.editModal.show, (newVal) => {
  if (newVal) {
    // Use nextTick to ensure the input is rendered before trying to focus
    nextTick(() => {
      restaurantNameInput.value?.focus()
    })
  }
})
</script>

<template>
  <div v-if="groupStore.editModal.show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="groupStore.closeEditModal">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col scale-95" :class="{ 'scale-100': groupStore.editModal.show }" @click.stop>
      <div class="flex items-center justify-between p-5 border-b">
        <h3 class="text-2xl font-bold text-amber-800">編輯餐廳</h3>
        <button @click="groupStore.closeEditModal" class="text-gray-400 hover:text-gray-600 cursor-pointer"><i class="fa-solid fa-times fa-lg"></i></button>
      </div>
      <div class="p-6 space-y-5 overflow-y-auto">
        <div v-if="groupStore.isLoading" class="text-center py-10">載入中...</div>
        <form v-else-if="groupStore.editModal.restaurant" @submit.prevent="groupStore.updateRestaurant" @keyup.enter="groupStore.updateRestaurant">
          <div>
            <label class="block text-sm font-medium text-amber-800 mb-1">餐廳名稱 (必填)</label>
            <input v-model="groupStore.editModal.restaurant.name" type="text" required class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" ref="restaurantNameInput" />
          </div>
          <div>
            <label class="block text-sm font-medium text-amber-800 mb-1">地址</label>
            <input v-model="groupStore.editModal.restaurant.address" type="text" class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-amber-800 mb-1">電話</label>
            <input v-model="groupStore.editModal.restaurant.phone" type="text" class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <h4 class="text-sm font-medium text-amber-800 mb-2">菜單圖片管理</h4>
            <div v-if="groupStore.editModal.restaurant.menu && groupStore.editModal.restaurant.menu.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              <div v-for="(image, index) in groupStore.editModal.restaurant.menu" :key="image" class="relative">
                <img :src="image" alt="Menu Image" class="w-full h-28 object-cover rounded-lg border" />
                <button @click.prevent="groupStore.removeEditImage(index)" class="cursor-pointer absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700" title="移除圖片"><i class="fa-solid fa-times"></i></button>
              </div>
            </div>
            <p v-else class="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">目前沒有菜單圖片。</p>

            <!-- 新增圖片上傳區塊 -->
            <div class="mb-4">
              <label for="edit-menu-upload" class="flex items-center justify-center px-4 py-6 bg-amber-100 text-amber-700 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200">
                <i class="fa-solid fa-cloud-arrow-up text-2xl mr-3"></i>
                <span>{{ groupStore.editModal.editMenuFiles.length > 0 ? `已選擇 ${groupStore.editModal.editMenuFiles.length} 張新圖片` : '點我上傳新菜單圖片 (可多選)' }}</span>
              </label>
              <input id="edit-menu-upload" type="file" accept=".png, .jpg, .jpeg" multiple @change="groupStore.handleEditFileChange" class="sr-only" />
              <div class="flex justify-between items-center mt-1">
                <p class="text-xs text-amber-600 ml-1">支援jpg/png，最多5張 (包含現有圖片)</p>
                <button v-if="groupStore.editModal.editMenuFiles.length > 0" @click="groupStore.removeNewEditImage" type="button" class="text-xs text-red-500 hover:text-red-700 underline cursor-pointer">清空新圖片</button>
              </div>
            </div>

            <div v-if="groupStore.editModal.editMenuPreviews.length > 0" class="mb-4">
              <p class="text-sm text-amber-700 mb-3">新菜單預覽 ({{ (groupStore.editModal.restaurant.menu ? groupStore.editModal.restaurant.menu.length : 0) + groupStore.editModal.editMenuPreviews.length }}/5):</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <div v-for="(preview, index) in groupStore.editModal.editMenuPreviews" :key="index" class="relative">
                  <img :src="preview.src" :alt="`新預覽 ${index + 1}`" class="w-full h-28 object-cover rounded-lg border" />
                  <button @click="groupStore.removeNewEditImage(index)" type="button" class="cursor-pointer absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700" title="移除圖片">
                    <i class="fa-solid fa-times text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="flex justify-end gap-4 p-5 border-t bg-gray-50 rounded-b-xl">
        <button @click="groupStore.closeEditModal" class="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 cursor-pointer">取消</button>
        <button @click="groupStore.updateRestaurant" :disabled="groupStore.editModal.isSaving" class="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 cursor-pointer">
          {{ groupStore.editModal.isSaving ? '儲存中...' : '儲存變更' }}
        </button>
      </div>
    </div>
  </div>
</template>
