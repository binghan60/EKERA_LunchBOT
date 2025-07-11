<script setup>
import { ref } from 'vue'
import { useGroupStore } from '@/stores/group'
import LunchNotificationToggle from './LunchNotificationToggle.vue'
import RestaurantEditModal from './RestaurantEditModal.vue'
import ImageDisplayModal from './ImageDisplayModal.vue'
import ConfirmationModal from './ConfirmationModal.vue'
import RestaurantCreationForm from './RestaurantCreationForm.vue'
import RestaurantList from './RestaurantList.vue'
import OfficeCreationForm from './OfficeCreationForm.vue'
import OfficeBindingList from './OfficeBindingList.vue'

const groupStore = useGroupStore()

const isDragging = ref(false)
const draggedRestaurant = ref(null)

function startDrag(restaurant) {
  isDragging.value = true
  draggedRestaurant.value = restaurant
  groupStore.draggedRestaurant = restaurant;
}

function endDrag() {
  isDragging.value = false
  draggedRestaurant.value = null
  groupStore.draggedRestaurant = null
  groupStore.dragOverOffice = null
}
</script>

<template>
  <div class="bg-amber-50 min-h-screen p-4 sm:p-6 lg:p-8">
    <div class="max-w-7xl mx-auto">
      <header class="text-center mb-10">
        <h1 class="text-4xl sm:text-5xl font-bold text-amber-900 tracking-tight">午餐醬 後台管理</h1>
        <p class="mt-3 text-lg text-amber-700">輕鬆管理您的餐廳、辦公室與每日推播</p>
      </header>
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LunchNotificationToggle />
        <OfficeCreationForm />
      </section>
      <RestaurantCreationForm />
      <section class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <RestaurantList @dragstart="startDrag" @dragend="endDrag" />
        <OfficeBindingList :draggedRestaurant="draggedRestaurant" :isDragging="isDragging" />
      </section>
      <RestaurantEditModal />
      <ImageDisplayModal />
      <ConfirmationModal />
    </div>
  </div>
  <VueLoading v-model:active="groupStore.isLoading" :is-full-page="true" color="#D97706" />
</template>
