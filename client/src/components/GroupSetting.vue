<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'
const toast = useToast()

// ✅ 接收 prop
const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
})
const groupId = props.groupId

// ✅ 檢查 groupId 是否存在
if (!groupId) {
  toast.error('找不到 groupId！網址應包含?groupId=xxx')
  throw new Error('Missing groupId in props')
}

const API_PATH = import.meta.env.VITE_API_PATH || ''
const API_Route = 'group-setting'
const isLoading = ref(false)

// ✅ 群組設定資料
const groupSetting = reactive({
  groupId,
  lunchNotification: false,
  currentOffice: '',
  officeOption: [],
})

const newOffice = ref('')

// ✅ 餐廳表單與清單
const restaurants = ref([])
const form = ref({ name: '', phone: '', address: '', tags: '' })

// ✅ 多張圖片上傳處理
const menuFiles = ref([]) // 改為陣列存儲多個檔案
const menuPreviews = ref([]) // 改為陣列存儲多個預覽

const handleFileChange = (e) => {
  const files = Array.from(e.target.files) // 轉換為陣列

  // 檢查檔案數量限制（最多5張）
  if (menuFiles.value.length + files.length > 5) {
    toast.error('最多只能上傳5張圖片')
    return
  }

  files.forEach((file) => {
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} 不是有效的圖片檔案`)
      return
    }

    // 檢查檔案大小（例如：限制5MB）
    // if (file.size > 2 * 1024 * 1024) {
    //   toast.error(`${file.name} 檔案過大，請選擇小於2MB的圖片`);
    //   return;
    // }

    menuFiles.value.push(file)

    // 產生預覽
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

  // 清空 input，允許重複選擇相同檔案
  e.target.value = ''
}

const removeMenuImage = (index) => {
  menuFiles.value.splice(index, 1)
  menuPreviews.value.splice(index, 1)

  // 重新索引預覽陣列
  menuPreviews.value.forEach((preview, i) => {
    preview.index = i
  })
}

const removeAllMenuImages = () => {
  menuFiles.value = []
  menuPreviews.value = []
}

// ✅ 編輯模式下多張圖片上傳處理
const handleEditFileChange = (e) => {
  const files = Array.from(e.target.files)

  // 檢查檔案數量限制（最多5張）
  if ((editModal.restaurant.menu ? editModal.restaurant.menu.length : 0) + editModal.editMenuFiles.length + files.length > 5) {
    toast.error('最多只能上傳5張圖片')
    return
  }

  files.forEach((file) => {
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} 不是有效的圖片檔案`)
      return
    }

    editModal.editMenuFiles.push(file)

    // 產生預覽
    const reader = new FileReader()
    reader.onload = (e) => {
      editModal.editMenuPreviews.push({
        src: e.target.result,
        name: file.name,
        index: editModal.editMenuFiles.length - 1,
      })
    }
    reader.readAsDataURL(file)
  })

  // 清空 input，允許重複選擇相同檔案
  e.target.value = ''
}

const removeNewEditImage = (index) => {
  editModal.editMenuFiles.splice(index, 1)
  editModal.editMenuPreviews.splice(index, 1)

  // 重新索引預覽陣列
  editModal.editMenuPreviews.forEach((preview, i) => {
    preview.index = i
  })
}

// ✅ 新增：拖拉功能相關變數
const isDragging = ref(false)
const draggedRestaurant = ref(null)
const dragOverOffice = ref(null)
const officeRestaurants = ref([]) // 辦公室餐廳綁定清單

// -------------------- 群組設定 --------------------

async function fetchGroupSetting() {
  isLoading.value = true
  try {
    const { data } = await axios.get(`${API_PATH}/${API_Route}/${groupId}`)
    groupSetting.lunchNotification = data.lunchNotification
    groupSetting.currentOffice = data.currentOffice
    groupSetting.officeOption = data.officeOption
  } catch {
    toast.warning('找不到群組設定')
  } finally {
    isLoading.value = false
  }
}

async function saveSetting() {
  isLoading.value = true
  const payload = {
    groupId,
    lunchNotification: groupSetting.lunchNotification,
    currentOffice: groupSetting.currentOffice,
    officeOption: groupSetting.officeOption,
  }

  try {
    await axios.put(`${API_PATH}/${API_Route}/${groupId}`, payload)
    toast.success('設定已更新！')
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        await axios.post(`${API_PATH}/${API_Route}`, payload)
        toast.success('新群組設定已建立！')
      } catch (postErr) {
        toast.error('建立群組失敗：' + postErr.message)
      }
    } else {
      toast.error('更新失敗：' + err.message)
    }
  } finally {
    isLoading.value = false
  }
}

function addOffice() {
  const trimmed = newOffice.value.trim()
  if (!trimmed) return toast.info('辦公室名稱不能為空。')
  if (groupSetting.officeOption.includes(trimmed)) return toast.info('辦公室名稱已存在。')

  groupSetting.officeOption.push(trimmed)
  newOffice.value = ''
  saveSetting()
}

function removeOffice(officeName) {
  if (officeName === groupSetting.currentOffice) {
    toast.warning('無法刪除目前正在使用的辦公室')
    return
  }
  showConfirmModal('確認刪除', `確定要刪除辦公室 "${officeName}" 嗎？\n辦公室的餐廳資料會一併被刪除！`, async () => {
    groupSetting.officeOption = groupSetting.officeOption.filter((o) => o !== officeName)
    await saveSetting()
  })
}

// -------------------- 餐廳設定 --------------------

async function fetchRestaurants() {
  if (!groupId) return
  isLoading.value = true
  try {
    const { data } = await axios.get(`${API_PATH}/restaurant?groupId=${groupId}`)
    restaurants.value = data
  } catch (err) {
    toast.error(err.data?.message || '餐廳資料讀取失敗')
  } finally {
    isLoading.value = false
  }
}

const createRestaurant = async () => {
  if (!form.value.name) {
    toast.error('請填寫餐廳名稱')
    return
  }

  try {
    isLoading.value = true
    const formData = new FormData()
    formData.append('groupId', groupId)
    formData.append('name', form.value.name)
    formData.append('phone', form.value.phone || '')
    formData.append('address', form.value.address || '')
    formData.append('tags', JSON.stringify(form.value.tags || []))

    // 添加所有菜單圖片
    menuFiles.value.forEach((file) => {
      formData.append('menu', file)
    })

    await axios.post(`${API_PATH}/restaurant`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.success('新增成功')
    await fetchRestaurants()

    form.value = { name: '', phone: '', address: '', tags: [] }
    menuFiles.value = []
    menuPreviews.value = []
  } catch (err) {
    console.log(err)
    toast.error('新增失敗')
  } finally {
    isLoading.value = false
  }
}

async function deleteRestaurant(id) {
  showConfirmModal('確認刪除', `確定要刪除這間餐廳嗎？此操作無法復原。`, async () => {
    try {
      await axios.delete(`${API_PATH}/restaurant/${id}`, { data: { groupId } })
      restaurants.value = restaurants.value.filter((r) => r._id !== id)
      await fetchOfficeRestaurants()
      toast.success('刪除成功')
    } catch (err) {
      toast.error(err.data?.message || '刪除失敗')
    }
  })
}

// -------------------- 新增：拖拉綁定功能 --------------------

// 取得指定辦公室的餐廳清單
function getOfficeRestaurants(office) {
  return officeRestaurants.value.filter((binding) => binding.office === office)
}

// 開始拖拉
function startDrag(restaurant) {
  isDragging.value = true
  draggedRestaurant.value = restaurant
}

// 結束拖拉
function endDrag() {
  isDragging.value = false
  dragOverOffice.value = null
}

// 放下餐廳到辦公室
async function dropRestaurant(office) {
  if (!draggedRestaurant.value) return
  dragOverOffice.value = null
  try {
    // 檢查是否已經��定
    const existing = officeRestaurants.value.find((binding) => binding.office === office && binding.restaurantId._id === draggedRestaurant.value._id)

    if (existing) {
      toast.info('此餐廳已綁定到該辦公室')
      return
    }
    isLoading.value = true
    await axios.post(`${API_PATH}/group-restaurant`, {
      groupId,
      office,
      restaurantId: draggedRestaurant.value._id,
      isActiveInOffice: true,
    })
    toast.success(`已將 ${draggedRestaurant.value.name} 綁定到 ${office}`)

    // 重新載入綁定清單
    await fetchOfficeRestaurants()
  } catch (err) {
    console.error('綁定失敗:', err)
    toast.error(err.response?.data?.error || '綁定失敗')
  } finally {
    isLoading.value = false
    endDrag()
  }
}

// 載入辦公室餐廳綁定清單
async function fetchOfficeRestaurants() {
  if (!groupId) return

  try {
    const { data } = await axios.get(`${API_PATH}/group-restaurant/${groupId}`)
    officeRestaurants.value = data
  } catch (err) {
    console.error('載入辦公室餐廳清單失敗:', err)
    toast.error('載入辦公室餐廳清單失敗')
  }
}

// 切換辦公室餐廳狀態
async function toggleOfficeRestaurant(binding) {
  try {
    await axios.put(`${API_PATH}/group-restaurant/${binding._id}`, {
      isActiveInOffice: !binding.isActiveInOffice,
    })

    binding.isActiveInOffice = !binding.isActiveInOffice
    toast.success('狀態已更新')
  } catch (err) {
    console.error('切換辦公室餐廳狀態失敗:', err)
    toast.error('狀態更新失敗')
  }
}

// 移除辦公室餐廳綁定
async function removeOfficeRestaurant(bindingId) {
  showConfirmModal('確認移除', '確定要移除此餐廳綁定嗎？', async () => {
    try {
      await axios.delete(`${API_PATH}/group-restaurant/${bindingId}`)

      // 從清單中移除
      officeRestaurants.value = officeRestaurants.value.filter((binding) => binding._id !== bindingId)
      await fetchOfficeRestaurants()

      toast.success('已移除綁定')
    } catch (err) {
      console.error('移除辦公室餐廳綁定失敗:', err)
      toast.error('移除失敗')
    }
  })
}

// -------------------- 編輯 Modal 功能 --------------------
const editModal = reactive({
  show: false,
  restaurant: null,
  isSaving: false,
  imagesToDelete: [],
  editMenuFiles: [], // 新增：編輯模式下新上傳的檔案
  editMenuPreviews: [], // 新增：編輯模式下新上傳檔案的預覽
})

async function openEditModal(restaurant) {
  isLoading.value = true
  editModal.imagesToDelete = [] // 重置待刪除列表
  editModal.editMenuFiles = [] // 重置新上傳檔案
  editModal.editMenuPreviews = [] // 重置新上傳預覽
  document.body.style.overflow = 'hidden'
  try {
    const { data } = await axios.get(`${API_PATH}/restaurant/${restaurant._id}?groupId=${groupId}`)
    // 使用深拷貝，避免直接修改列表中的資料
    editModal.restaurant = JSON.parse(JSON.stringify(data))
    editModal.show = true
  } catch (error) {
    toast.error('讀取餐廳資料失敗')
    closeEditModal()
  } finally {
    isLoading.value = false
  }
}

function closeEditModal() {
  editModal.show = false
  editModal.restaurant = null
  editModal.imagesToDelete = []
  document.body.style.overflow = 'auto'
}

async function updateRestaurant() {
  if (!editModal.restaurant) return
  editModal.isSaving = true
  try {
    const formData = new FormData()
    formData.append('groupId', groupId)
    formData.append('name', editModal.restaurant.name)
    formData.append('phone', editModal.restaurant.phone || '')
    formData.append('address', editModal.restaurant.address || '')
    formData.append('imagesToDelete', JSON.stringify(editModal.imagesToDelete))

    // 添加新上傳的圖片
    editModal.editMenuFiles.forEach((file) => {
      formData.append('menu', file)
    })

    await axios.put(`${API_PATH}/restaurant/${editModal.restaurant._id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    toast.success('餐廳資料已更新！')
    await fetchRestaurants() // 重新載入列表以顯示更新
    closeEditModal()
  } catch (error) {
    toast.error('更新失敗')
    console.error(error)
  } finally {
    editModal.isSaving = false
  }
}

function removeEditImage(index) {
  if (editModal.restaurant && editModal.restaurant.menu) {
    const removedImage = editModal.restaurant.menu.splice(index, 1)
    if (removedImage.length > 0) {
      editModal.imagesToDelete.push(removedImage[0])
    }
  }
}

// -------------------- Confirmation Modal --------------------
const confirmModal = reactive({
  show: false,
  title: '',
  message: '',
  onConfirm: null,
  isConfirming: false,
})

function showConfirmModal(title, message, onConfirm) {
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.onConfirm = onConfirm
  confirmModal.show = true
  document.body.style.overflow = 'hidden'
}

function closeConfirmModal() {
  confirmModal.show = false
  confirmModal.title = ''
  confirmModal.message = ''
  confirmModal.onConfirm = null
  confirmModal.isConfirming = false
  document.body.style.overflow = 'auto'
}

async function handleConfirm() {
  if (typeof confirmModal.onConfirm === 'function') {
    confirmModal.isConfirming = true
    try {
      await confirmModal.onConfirm()
    } finally {
      confirmModal.isConfirming = false
      closeConfirmModal()
    }
  } else {
    closeConfirmModal()
  }
}

// -------------------- 初始化 --------------------

onMounted(() => {
  fetchGroupSetting()
  fetchRestaurants()
  fetchOfficeRestaurants()
})

const expandedOffices = ref({})
const allOfficesExpanded = computed(() => {
  return Object.values(expandedOffices.value).every((expanded) => expanded)
})

// 圖片彈窗管理
const imageModal = reactive({
  show: false,
  restaurant: null,
})

// 初始化辦公室展開狀態
const initializeOfficeStates = () => {
  groupSetting.officeOption.forEach((office) => {
    if (!(office in expandedOffices.value)) {
      if (groupSetting.currentOffice === office) {
        expandedOffices.value[office] = true // 預設展開
      } else {
        expandedOffices.value[office] = false // 預設關閉
      }
    }
  })
}

// 切換單個辦公室展開狀態
const toggleOffice = (office) => {
  expandedOffices.value[office] = !expandedOffices.value[office]
}

// 切換所有辦公室展開狀態
const toggleAllOffices = () => {
  const shouldExpand = !allOfficesExpanded.value
  groupSetting.officeOption.forEach((office) => {
    expandedOffices.value[office] = shouldExpand
  })
}

// 打開圖片彈窗
const openImageModal = (restaurant) => {
  imageModal.restaurant = restaurant
  imageModal.show = true
  document.body.style.overflow = 'hidden' // 防止背景滾動
}

// 關閉圖片彈窗
const closeImageModal = () => {
  imageModal.show = false
  imageModal.restaurant = null
  document.body.style.overflow = 'auto'
}

const setDefaultOffice = (office) => {
  groupSetting.currentOffice = office
  saveSetting()
}

// 在組件掛載時初始化
onMounted(() => {
  initializeOfficeStates()
})

// 監聽辦公室選項變化
watch(
  () => groupSetting.officeOption,
  () => {
    initializeOfficeStates()
  },
  { deep: true },
)
</script>

<template>
  <div class="bg-amber-50 min-h-screen p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <header class="text-center mb-10">
        <h1 class="text-4xl sm:text-5xl font-bold text-amber-900 tracking-tight">午餐醬 後台管理</h1>
        <p class="mt-3 text-lg text-amber-700">輕鬆管理您的餐廳、辦公室與每日推播</p>
      </header>

      <!-- Top Cards -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50 duration-300 hover:shadow-xl hover:-translate-y-1">
          <h3 class="text-xl font-semibold text-amber-800 mb-4">午餐通知</h3>
          <div class="flex items-center justify-between w-full">
            <label class="inline-flex items-center cursor-pointer flex-grow">
              <input type="checkbox" v-model="groupSetting.lunchNotification" @change="saveSetting" class="sr-only peer" />
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600 dark:peer-checked:bg-amber-600"></div>
              <span class="ms-3 text-base font-medium text-amber-700">
                {{ groupSetting.lunchNotification ? '開啟午餐通知' : '關閉午餐通知' }}
              </span>
            </label>
          </div>
          <p class="text-sm text-amber-600 mt-2">啟用後，將於每日 11:25 自動推播隨機餐廳。</p>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50 duration-300 hover:shadow-xl hover:-translate-y-1">
          <h3 class="text-xl font-semibold text-amber-800 mb-4">管理辦公室</h3>
          <div class="flex flex-col sm:flex-row gap-3 w-full">
            <input v-model="newOffice" type="text" placeholder="輸入新辦公室名稱" class="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-amber-900 placeholder-amber-600" />
            <button @click="addOffice" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md flex-shrink-0 cursor-pointer">新增辦公室</button>
          </div>
          <p class="text-sm text-amber-600 mt-2">為您的群組新增不同辦公室地點以便綁定餐廳。</p>
        </div>
      </section>

      <!-- Restaurant Panel -->
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

          <button type="submit" :disabled="isLoading" class="md:col-span-2 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg cursor-pointer">
            {{ isLoading ? '新增中...' : '新增餐廳' }}
          </button>
        </form>
      </section>

      <!-- Restaurant & Office Management -->
      <section class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 class="text-xl font-semibold text-amber-800">所有餐廳清單</h3>
          </div>
          <div class="max-h-[500px] overflow-y-auto p-1 -mr-2 pr-2">
            <div v-if="restaurants.length === 0" class="text-amber-800 text-center py-8">尚無餐廳資料</div>
            <div v-else class="space-y-3">
              <div v-for="r in restaurants" :key="r._id" draggable="true" @dragstart="startDrag(r)" @dragend="endDrag" class="p-3 bg-amber-50 border border-amber-300 rounded-lg cursor-move hover:bg-amber-100" :class="{ 'opacity-50': isDragging && draggedRestaurant?._id === r._id }">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img v-if="r.menu && r.menu.length > 0" :src="r.menu[0]" alt="菜單" class="w-full sm:w-20 sm:h-20 h-40 object-cover rounded-md border border-amber-300 shadow cursor-pointer" @click="openImageModal(r)" />
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
                    <button @click="openEditModal(r)" class="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow" aria-label="編輯"><i class="fa-solid fa-pencil cursor-pointer"></i></button>
                    <button @click="deleteRestaurant(r._id)" class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 shadow" aria-label="刪除"><i class="fa-solid fa-trash cursor-pointer"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 class="text-xl font-semibold text-amber-800">辦公室與綁定餐廳</h3>
            <button @click="toggleAllOffices" class="cursor-pointer px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">{{ allOfficesExpanded ? '全部收合' : '全部展開' }}</button>
          </div>
          <div class="space-y-4 max-h-[500px] overflow-y-auto p-1 -mr-2 pr-2">
            <div v-if="groupSetting.officeOption.length === 0" class="text-center text-gray-500 py-12">
              <div class="font-medium text-gray-600">目前沒有辦公室</div>
              <div class="text-sm text-gray-500">請先新增辦公室以便管理餐廳綁定</div>
            </div>
            <div v-for="office in groupSetting.officeOption" :key="office" class="border border-amber-300 rounded-lg overflow-hidden">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-amber-100 cursor-pointer hover:bg-amber-150" @click="toggleOffice(office)">
                <div class="flex items-center flex-1 mb-2 sm:mb-0">
                  <div class="mr-3 text-amber-600" :class="{ 'rotate-90': expandedOffices[office] }"><i class="fa-solid fa-chevron-right"></i></div>
                  <span class="font-medium" :class="office === groupSetting.currentOffice ? 'font-bold text-amber-800' : 'text-amber-700'">{{ office }}</span>
                  <span class="ml-3 px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">{{ getOfficeRestaurants(office).length }}</span>
                  <span v-if="office === groupSetting.currentOffice" class="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full shadow-sm">目前</span>
                </div>
                <div class="flex items-center gap-2 self-end" @click.stop>
                  <button v-if="office !== groupSetting.currentOffice" @click="setDefaultOffice(office)" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg cursor-pointer">設為預設</button>
                  <button @click="removeOffice(office)" v-if="office !== groupSetting.currentOffice" class="bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 rounded-lg font-medium cursor-pointer">刪除</button>
                </div>
              </div>
              <div v-show="expandedOffices[office]">
                <div class="p-4 min-h-24" :class="dragOverOffice === office ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-300' : 'bg-white'" @dragover.prevent="dragOverOffice = office" @dragleave="dragOverOffice = null" @drop="dropRestaurant(office)">
                  <div v-if="getOfficeRestaurants(office).length === 0" class="text-center text-gray-400 py-8">
                    <div class="text-sm text-amber-700 font-medium">拖拉餐廳到這裡進行綁定</div>
                  </div>
                  <div v-else class="space-y-3">
                    <div v-for="binding in getOfficeRestaurants(office)" :key="binding._id" class="flex flex-col sm:flex-row items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200 hover:bg-amber-100">
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm text-amber-900">{{ binding.restaurantId?.name || '未知餐廳' }}</div>
                      </div>
                      <div class="flex items-center gap-3 self-end">
                        <button @click="toggleOfficeRestaurant(binding)" :class="binding.isActiveInOffice ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'" class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer">
                          {{ binding.isActiveInOffice ? '啟用' : '停用' }}
                        </button>
                        <button @click="removeOfficeRestaurant(binding._id)" class="cursor-pointer w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm" title="移除綁定"><i class="fa-solid fa-times"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modals -->
      <div v-if="imageModal.show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="closeImageModal">
        <div class="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl scale-95" :class="{ 'scale-100': imageModal.show }" @click.stop>
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-xl font-semibold text-amber-800">{{ imageModal.restaurant?.name }} - 菜單</h3>
            <button @click="closeImageModal" class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"><i class="fa-solid fa-times fa-lg"></i></button>
          </div>
          <div class="p-4 overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img v-for="(image, index) in imageModal.restaurant?.menu" :key="index" :src="image" :alt="`菜單 ${index + 1}`" class="w-full h-auto object-cover rounded-lg border" />
            </div>
          </div>
        </div>
      </div>

      <div v-if="editModal.show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="closeEditModal">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col scale-95" :class="{ 'scale-100': editModal.show }" @click.stop>
          <div class="flex items-center justify-between p-5 border-b">
            <h3 class="text-2xl font-bold text-amber-800">編輯餐廳</h3>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 cursor-pointer"><i class="fa-solid fa-times fa-lg"></i></button>
          </div>
          <div class="p-6 space-y-5 overflow-y-auto">
            <div v-if="editModal.isLoading" class="text-center py-10">載入中...</div>
            <form v-else-if="editModal.restaurant" @submit.prevent="updateRestaurant">
              <div>
                <label class="block text-sm font-medium text-amber-800 mb-1">餐廳名稱 (必填)</label>
                <input v-model="editModal.restaurant.name" type="text" required class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-amber-800 mb-1">地址</label>
                <input v-model="editModal.restaurant.address" type="text" class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label class="block text-sm font-medium text-amber-800 mb-1">電話</label>
                <input v-model="editModal.restaurant.phone" type="text" class="w-full border p-3 rounded-lg text-amber-900 border-amber-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <h4 class="text-sm font-medium text-amber-800 mb-2">菜單圖片管理</h4>
                <div v-if="editModal.restaurant.menu && editModal.restaurant.menu.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                  <div v-for="(image, index) in editModal.restaurant.menu" :key="image" class="relative">
                    <img :src="image" alt="Menu Image" class="w-full h-28 object-cover rounded-lg border" />
                    <button @click.prevent="removeEditImage(index)" class="cursor-pointer absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700" title="移除圖片"><i class="fa-solid fa-times"></i></button>
                  </div>
                </div>
                <p v-else class="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">目前沒有菜單圖片。</p>

                <!-- 新增圖片上傳區塊 -->
                <div class="mb-4">
                  <label for="edit-menu-upload" class="flex items-center justify-center px-4 py-6 bg-amber-100 text-amber-700 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200">
                    <i class="fa-solid fa-cloud-arrow-up text-2xl mr-3"></i>
                    <span>{{ editModal.editMenuFiles.length > 0 ? `已選擇 ${editModal.editMenuFiles.length} 張新圖片` : '點我上傳新菜單圖片 (可多選)' }}</span>
                  </label>
                  <input id="edit-menu-upload" type="file" accept=".png, .jpg, .jpeg" multiple @change="handleEditFileChange" class="sr-only" />
                  <div class="flex justify-between items-center mt-1">
                    <p class="text-xs text-amber-600 ml-1">支援jpg/png，最多5張 (包含現有圖片)</p>
                    <button v-if="editModal.editMenuFiles.length > 0" @click="removeNewEditImage" type="button" class="text-xs text-red-500 hover:text-red-700 underline cursor-pointer">清空新圖片</button>
                  </div>
                </div>

                <div v-if="editModal.editMenuPreviews.length > 0" class="mb-4">
                  <p class="text-sm text-amber-700 mb-3">新菜單預覽 ({{ (editModal.restaurant.menu ? editModal.restaurant.menu.length : 0) + editModal.editMenuPreviews.length }}/5):</p>
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    <div v-for="(preview, index) in editModal.editMenuPreviews" :key="index" class="relative">
                      <img :src="preview.src" :alt="`新預覽 ${index + 1}`" class="w-full h-28 object-cover rounded-lg border" />
                      <button @click="removeNewEditImage(index)" type="button" class="cursor-pointer absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700" title="移除圖片">
                        <i class="fa-solid fa-times text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="flex justify-end gap-4 p-5 border-t bg-gray-50 rounded-b-xl">
            <button @click="closeEditModal" class="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 cursor-pointer">取消</button>
            <button @click="updateRestaurant" :disabled="editModal.isSaving" class="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 cursor-pointer">
              {{ editModal.isSaving ? '儲存中...' : '儲存變更' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div v-if="confirmModal.show" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click="closeConfirmModal">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col scale-95" :class="{ 'scale-100': confirmModal.show }" @click.stop>
          <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <i class="fa-solid fa-triangle-exclamation text-2xl text-red-600"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">{{ confirmModal.title }}</h3>
            <p class="text-gray-600 mt-2 whitespace-pre-line">{{ confirmModal.message }}</p>
          </div>
          <div class="flex justify-center gap-4 p-4 bg-gray-50 rounded-b-xl">
            <button @click="closeConfirmModal" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium cursor-pointer">取消</button>
            <button @click="handleConfirm" :disabled="confirmModal.isConfirming" class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium cursor-pointer">
              {{ confirmModal.isConfirming ? '處理中...' : '確定' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <VueLoading v-model:active="isLoading" :is-full-page="true" color="#D97706" />
</template>
