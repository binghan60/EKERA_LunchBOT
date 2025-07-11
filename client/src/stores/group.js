import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useToast } from 'vue-toastification'

export const useGroupStore = defineStore('group', () => {
  const toast = useToast()

  // State
  const groupId = ref(null)
  const isLoading = ref(false)

  const groupSetting = reactive({
    lunchNotification: false,
    currentOffice: '',
    officeOption: [],
  })

  const restaurants = ref([])
  const officeRestaurants = ref([]) // 辦公室餐廳綁定清單

  // Modals state (moved here for centralized management, but actual modal components will be separate)
  const editModal = reactive({
    show: false,
    restaurant: null,
    isSaving: false,
    imagesToDelete: [],
    editMenuFiles: [],
    editMenuPreviews: [],
    triggeringElement: null,
  })

  const imageModal = reactive({
    show: false,
    restaurant: null,
  })

  const confirmModal = reactive({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    isConfirming: false,
  })

  // API Path
  const API_PATH = import.meta.env.VITE_API_PATH || ''
  const GROUP_SETTING_ROUTE = 'group-setting'
  const RESTAURANT_ROUTE = 'restaurant'
  const GROUP_RESTAURANT_ROUTE = 'group-restaurant'

  // Actions
  function setGroupId(id) {
    groupId.value = id
    if (!id) {
      toast.error('找不到 groupId！網址應包含?groupId=xxx')
      throw new Error('Missing groupId in props')
    }
  }

  async function fetchGroupSetting() {
    if (!groupId.value) return
    isLoading.value = true
    try {
      const { data } = await axios.get(`${API_PATH}/${GROUP_SETTING_ROUTE}/${groupId.value}`)
      groupSetting.lunchNotification = data.lunchNotification
      groupSetting.currentOffice = data.currentOffice
      groupSetting.officeOption = data.officeOption
    } catch {
      toast.warning('找不到群組設定')
    } finally {
      isLoading.value = false
    }
  }

  async function saveGroupSetting() {
    if (!groupId.value) return
    isLoading.value = true
    const payload = {
      groupId: groupId.value,
      lunchNotification: groupSetting.lunchNotification,
      currentOffice: groupSetting.currentOffice,
      officeOption: groupSetting.officeOption,
    }

    try {
      await axios.put(`${API_PATH}/${GROUP_SETTING_ROUTE}/${groupId.value}`, payload)
      toast.success('設定已更新！')
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await axios.post(`${API_PATH}/${GROUP_SETTING_ROUTE}`, payload)
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

  async function addOffice(officeName) {
    const trimmed = officeName.trim()
    if (!trimmed) return toast.info('辦公室名稱不能為空。')
    if (groupSetting.officeOption.includes(trimmed)) return toast.info('辦公室名稱已存在。')

    groupSetting.officeOption.push(trimmed)
    await saveGroupSetting()
  }

  async function removeOffice(officeName) {
    if (officeName === groupSetting.currentOffice) {
      toast.warning('無法刪除目前正在使用的辦公室')
      return
    }
    showConfirmModal('確認刪除', `確定要刪除辦公室 "${officeName}" 嗎？\n辦公室的餐廳資料會一併被刪除！`, async () => {
      groupSetting.officeOption = groupSetting.officeOption.filter((o) => o !== officeName)
      await saveGroupSetting()
    })
  }

  async function setDefaultOffice(office) {
    groupSetting.currentOffice = office
    await saveGroupSetting()
  }

  async function fetchRestaurants() {
    if (!groupId.value) return
    isLoading.value = true
    try {
      const { data } = await axios.get(`${API_PATH}/${RESTAURANT_ROUTE}?groupId=${groupId.value}`)
      restaurants.value = data
    } catch (err) {
      toast.error(err.data?.message || '餐廳資料讀取失敗')
    } finally {
      isLoading.value = false
    }
  }

  async function createRestaurant(formData) {
    if (!groupId.value) return
    isLoading.value = true
    formData.append('groupId', groupId.value) // Ensure groupId is added

    try {
      await axios.post(`${API_PATH}/${RESTAURANT_ROUTE}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('新增成功')
      await fetchRestaurants()
      return true // Indicate success
    } catch (err) {
      console.error(err)
      toast.error('新增失敗')
      return false // Indicate failure
    } finally {
      isLoading.value = false
    }
  }

  async function deleteRestaurant(id) {
    showConfirmModal('確認刪除', `確定要刪除這間餐廳嗎？此操作無法復原。`, async () => {
      try {
        await axios.delete(`${API_PATH}/${RESTAURANT_ROUTE}/${id}`, { data: { groupId: groupId.value } })
        restaurants.value = restaurants.value.filter((r) => r._id !== id)
        await fetchOfficeRestaurants()
        toast.success('刪除成功')
      } catch (err) {
        toast.error(err.data?.message || '刪除失敗')
      }
    })
  }

  async function fetchOfficeRestaurants() {
    if (!groupId.value) return
    try {
      const { data } = await axios.get(`${API_PATH}/${GROUP_RESTAURANT_ROUTE}/${groupId.value}`)
      officeRestaurants.value = data
    } catch (err) {
      console.error('載入辦公室餐廳清單失敗:', err)
      toast.error('載入辦公室餐廳清單失敗')
    }
  }

  async function dropRestaurant(office, restaurant) {
    if (!groupId.value || !restaurant) return
    try {
      const existing = officeRestaurants.value.find((binding) => binding.office === office && binding.restaurantId._id === restaurant._id)
      if (existing) {
        toast.info('此餐廳已綁定到該辦公室')
        return
      }
      isLoading.value = true
      await axios.post(`${API_PATH}/${GROUP_RESTAURANT_ROUTE}`, {
        groupId: groupId.value,
        office,
        restaurantId: restaurant._id,
        isActiveInOffice: true,
      })
      toast.success(`已將 ${restaurant.name} 綁定到 ${office}`)
      await fetchOfficeRestaurants()
    } catch (err) {
      console.error('綁定失敗:', err)
      toast.error(err.response?.data?.error || '綁定失敗')
    } finally {
      isLoading.value = false
    }
  }

  async function toggleOfficeRestaurant(binding) {
    try {
      await axios.put(`${API_PATH}/${GROUP_RESTAURANT_ROUTE}/${binding._id}`, {
        isActiveInOffice: !binding.isActiveInOffice,
      })
      binding.isActiveInOffice = !binding.isActiveInOffice
      toast.success('狀態已更新')
    } catch (err) {
      console.error('切換辦公室餐廳狀態失敗:', err)
      toast.error('狀態更新失敗')
    }
  }

  async function removeOfficeRestaurant(bindingId) {
    showConfirmModal('確認移除', '確定要移除此餐廳綁定嗎？', async () => {
      try {
        await axios.delete(`${API_PATH}/${GROUP_RESTAURANT_ROUTE}/${bindingId}`)
        officeRestaurants.value = officeRestaurants.value.filter((binding) => binding._id !== bindingId)
        await fetchOfficeRestaurants()
        toast.success('已移除綁定')
      } catch (err) {
        console.error('移除辦公室餐廳綁定失敗:', err)
        toast.error('移除失敗')
      }
    })
  }

  // Edit Modal Actions
  async function openEditModal(restaurantId, event) {
    if (!groupId.value) return
    isLoading.value = true
    editModal.imagesToDelete = []
    editModal.editMenuFiles = []
    editModal.editMenuPreviews = []
    editModal.triggeringElement = event ? event.target : null
    document.body.style.overflow = 'hidden'
    try {
      const { data } = await axios.get(`${API_PATH}/${RESTAURANT_ROUTE}/${restaurantId}?groupId=${groupId.value}`)
      editModal.restaurant = JSON.parse(JSON.stringify(data))
      editModal.show = true
    } catch (error) {
      toast.error('讀取餐廳資料失敗')
      console.error(error)
      closeEditModal()
    } finally {
      isLoading.value = false
    }
  }

  function closeEditModal() {
    editModal.show = false
    editModal.restaurant = null
    editModal.imagesToDelete = []
    editModal.editMenuFiles = []
    editModal.editMenuPreviews = []
    document.body.style.overflow = 'auto'
    if (editModal.triggeringElement && typeof editModal.triggeringElement.focus === 'function') {
      editModal.triggeringElement.focus()
    }
    editModal.triggeringElement = null
  }

  async function updateRestaurant() {
    if (!editModal.restaurant || !groupId.value) return
    editModal.isSaving = true
    try {
      const formData = new FormData()
      formData.append('groupId', groupId.value)
      formData.append('name', editModal.restaurant.name)
      formData.append('phone', editModal.restaurant.phone || '')
      formData.append('address', editModal.restaurant.address || '')
      formData.append('imagesToDelete', JSON.stringify(editModal.imagesToDelete))

      editModal.editMenuFiles.forEach((file) => {
        formData.append('menu', file)
      })

      await axios.put(`${API_PATH}/${RESTAURANT_ROUTE}/${editModal.restaurant._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('餐廳資料已更新！')
      await fetchRestaurants()
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

  function handleEditFileChange(event) {
    const files = Array.from(event.target.files)
    const currentImageCount = (editModal.restaurant.menu ? editModal.restaurant.menu.length : 0)
    const totalNewImages = files.length

    if (currentImageCount + totalNewImages > 5) {
      toast.error(`圖片總數不能超過 5 張 (目前已有 ${currentImageCount} 張)。`)
      event.target.value = '' // Clear the input
      return
    }

    editModal.editMenuFiles = []
    editModal.editMenuPreviews = []

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          editModal.editMenuPreviews.push({ src: e.target.result, file: file })
        }
        reader.readAsDataURL(file)
        editModal.editMenuFiles.push(file)
      } else {
        toast.warning(`檔案 ${file.name} 不是圖片格式，已略過。`)
      }
    })
  }

  function removeNewEditImage(index) {
    if (index === undefined) {
      // Clear all new images
      editModal.editMenuFiles = []
      editModal.editMenuPreviews = []
    } else {
      // Remove specific image by index
      editModal.editMenuFiles.splice(index, 1)
      editModal.editMenuPreviews.splice(index, 1)
    }
  }

  // Image Modal Actions
  function openImageModal(restaurant) {
    imageModal.restaurant = restaurant
    imageModal.show = true
    document.body.style.overflow = 'hidden'
  }

  function closeImageModal() {
    imageModal.show = false
    imageModal.restaurant = null
    document.body.style.overflow = 'auto'
  }

  // Confirmation Modal Actions
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

  // Initial data fetch
  async function initializeGroupData() {
    if (groupId.value) {
      await Promise.all([fetchGroupSetting(), fetchRestaurants(), fetchOfficeRestaurants()])
    }
  }

  return {
    // State
    groupId,
    isLoading,
    groupSetting,
    restaurants,
    officeRestaurants,
    editModal,
    imageModal,
    confirmModal,

    // Actions
    setGroupId,
    fetchGroupSetting,
    saveGroupSetting,
    addOffice,
    removeOffice,
    setDefaultOffice,
    fetchRestaurants,
    createRestaurant,
    deleteRestaurant,
    fetchOfficeRestaurants,
    dropRestaurant,
    toggleOfficeRestaurant,
    removeOfficeRestaurant,
    openEditModal,
    closeEditModal,
    updateRestaurant,
    removeEditImage,
    handleEditFileChange,
    removeNewEditImage,
    openImageModal,
    closeImageModal,
    showConfirmModal,
    closeConfirmModal,
    handleConfirm,
    initializeGroupData,
  }
})
