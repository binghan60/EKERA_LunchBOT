<script setup>
import { ref } from 'vue'
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()

const form = ref({ name: '', phone: '', address: '', tags: '' })
const menuFiles = ref([])
const menuPreviews = ref([])

const handleFileChange = (e) => {
  const files = Array.from(e.target.files)

  if (menuFiles.value.length + files.length > 5) {
    groupStore.toast.error('最多只能上傳5張圖片')
    return
  }

  files.forEach((file) => {
    if (!file.type.startsWith('image/')) {
      groupStore.toast.error(`${file.name} 不是有效的圖片檔案`)
      return
    }
    menuFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      menuPreviews.value.push({
        src: e.target.result,
        name: file.name,
        index: menuFiles.value.length - 1,
      })
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removeMenuImage = (index) => {
  menuFiles.value.splice(index, 1)
  menuPreviews.value.splice(index, 1)
  menuPreviews.value.forEach((preview, i) => {
    preview.index = i
  })
}

const removeAllMenuImages = () => {
  menuFiles.value = []
  menuPreviews.value = []
}

const createRestaurant = async () => {
  if (!form.value.name) {
    groupStore.toast.error('請填寫餐廳名稱')
    return
  }

  const formData = new FormData()
  formData.append('name', form.value.name)
  formData.append('phone', form.value.phone || '')
  formData.append('address', form.value.address || '')
  formData.append('tags', JSON.stringify(form.value.tags || []))

  menuFiles.value.forEach((file) => {
    formData.append('menu', file)
  })

  const success = await groupStore.createRestaurant(formData)
  if (success) {
    form.value = { name: '', phone: '', address: '', tags: [] }
    menuFiles.value = []
    menuPreviews.value = []
  }
}
</script>

<template>
  <section class="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-amber-200/50">
    <h2 class="text-2xl font-bold text-amber-800 mb-4">餐廳設定面板</h2>
    <form @submit.prevent="createRestaurant" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <input v-model="form.name" type="text" placeholder="餐廳名稱 (必填)" required class="border p-3 rounded-lg text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
      <input v-model="form.phone" type="text" placeholder="電話" class="border p-3 rounded-lg text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
      <input v-model="form.address" type="text" placeholder="地址" class="border p-3 rounded-lg md:col-span-2 text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />

      <div class="md:col-span-2">
        <label for="menu-upload" class="flex items-center justify-center px-4 py-6 bg-amber-100 text-amber-700 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200">
          <i class="fa-solid fa-cloud-arrow-up text-2xl mr-3"></i>
          <span>{{ menuFiles.length > 0 ? `已選擇 ${menuFiles.length} 張圖片` : '點我上傳菜單圖片 (可多選)' }}</span>
        </label>
        <input id="menu-upload" type="file" accept=".png, .jpg, .jpeg" multiple @change="handleFileChange" class="sr-only" />
        <div class="flex justify-between items-center mt-1">
          <p class="text-xs text-amber-600 ml-1">支援jpg/png，最多5張</p>
          <button v-if="menuFiles.length > 0" @click="removeAllMenuImages" type="button" class="text-xs text-red-500 hover:text-red-700 underline cursor-pointer">清空</button>
        </div>
      </div>

      <div v-if="menuPreviews.length > 0" class="md:col-span-2">
        <p class="text-sm text-amber-700 mb-3">菜單預覽 ({{ menuPreviews.length }}/5):</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div v-for="(preview, index) in menuPreviews" :key="index" class="relative border border-amber-300 rounded-lg overflow-hidden shadow-sm">
            <img :src="preview.src" :alt="`預覽 ${index + 1}`" class="w-full h-32 object-cover" />
            <button @click="removeMenuImage(index)" type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg" title="移除圖片">
              <i class="fa-solid fa-times text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <button type="submit" :disabled="groupStore.isLoading" class="md:col-span-2 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg cursor-pointer">
        {{ groupStore.isLoading ? '新增中...' : '新增餐廳' }}
      </button>
    </form>
  </section>
</template>
