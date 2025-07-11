<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useGroupStore } from '@/stores/group'

const groupStore = useGroupStore()

const props = defineProps({
  draggedRestaurant: {
    type: Object,
    default: null,
  },
  isDragging: {
    type: Boolean,
    default: false,
  },
})

const expandedOffices = ref({})
const allOfficesExpanded = computed(() => {
  return Object.values(expandedOffices.value).every((expanded) => expanded)
})

const initializeOfficeStates = () => {
  groupStore.groupSetting.officeOption.forEach((office) => {
    if (!(office in expandedOffices.value)) {
      if (groupStore.groupSetting.currentOffice === office) {
        expandedOffices.value[office] = true
      } else {
        expandedOffices.value[office] = false
      }
    }
  })
}

const toggleOffice = (office) => {
  expandedOffices.value[office] = !expandedOffices.value[office]
}

const toggleAllOffices = () => {
  const shouldExpand = !allOfficesExpanded.value
  groupStore.groupSetting.officeOption.forEach((office) => {
    expandedOffices.value[office] = shouldExpand
  })
}

function getOfficeRestaurants(office) {
  return groupStore.officeRestaurants.filter((binding) => binding.office === office)
}

watch(
  () => groupStore.groupSetting.officeOption,
  () => {
    initializeOfficeStates()
  },
  { deep: true },
)

onMounted(() => {
  initializeOfficeStates()
})
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-lg border border-amber-200/50">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
      <h3 class="text-xl font-semibold text-amber-800">辦公室與綁定餐廳</h3>
      <button @click="toggleAllOffices" class="cursor-pointer px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">{{ allOfficesExpanded ? '全部收合' : '全部展開' }}</button>
    </div>
    <div class="space-y-4 max-h-[500px] overflow-y-auto p-1 -mr-2 pr-2">
      <div v-if="groupStore.groupSetting.officeOption.length === 0" class="text-center text-gray-500 py-12">
        <div class="font-medium text-gray-600">目前沒有辦公室</div>
        <div class="text-sm text-gray-500">請先新增辦公室以便管理餐廳綁定</div>
      </div>
      <div v-for="office in groupStore.groupSetting.officeOption" :key="office" class="border border-amber-300 rounded-lg overflow-hidden">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-amber-100 cursor-pointer hover:bg-amber-150" @click="toggleOffice(office)">
          <div class="flex items-center flex-1 mb-2 sm:mb-0">
            <div class="mr-3 text-amber-600" :class="{ 'rotate-90': expandedOffices[office] }"><i class="fa-solid fa-chevron-right"></i></div>
            <span class="font-medium" :class="office === groupStore.groupSetting.currentOffice ? 'font-bold text-amber-800' : 'text-amber-700'">{{ office }}</span>
            <span class="ml-3 px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">{{ getOfficeRestaurants(office).length }}</span>
            <span v-if="office === groupStore.groupSetting.currentOffice" class="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full shadow-sm">目前</span>
          </div>
          <div class="flex items-center gap-2 self-end" @click.stop>
            <button v-if="office !== groupStore.groupSetting.currentOffice" @click="groupStore.setDefaultOffice(office)" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg cursor-pointer">設為預設</button>
            <button @click="groupStore.removeOffice(office)" v-if="office !== groupStore.groupSetting.currentOffice" class="bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 rounded-lg font-medium cursor-pointer">刪除</button>
          </div>
        </div>
        <div v-show="expandedOffices[office]">
          <div class="p-4 min-h-24" :class="groupStore.dragOverOffice === office ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-300' : 'bg-white'" @dragover.prevent="groupStore.dragOverOffice = office" @dragleave="groupStore.dragOverOffice = null" @drop="groupStore.dropRestaurant(office, props.draggedRestaurant)">
            <div v-if="getOfficeRestaurants(office).length === 0" class="text-center text-gray-400 py-8">
              <div class="text-sm text-amber-700 font-medium">拖拉餐廳到這裡進行綁定</div>
            </div>
            <div v-else class="space-y-3">
              <div v-for="binding in getOfficeRestaurants(office)" :key="binding._id" class="flex flex-col sm:flex-row items-start gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200 hover:bg-amber-100">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm text-amber-900">{{ binding.restaurantId?.name || '未知餐廳' }}</div>
                </div>
                <div class="flex items-center gap-3 self-end">
                  <button @click="groupStore.toggleOfficeRestaurant(binding)" :class="binding.isActiveInOffice ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'" class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer">
                    {{ binding.isActiveInOffice ? '啟用' : '停用' }}
                  </button>
                  <button @click="groupStore.removeOfficeRestaurant(binding._id)" class="cursor-pointer w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm" title="移除綁定"><i class="fa-solid fa-times"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
