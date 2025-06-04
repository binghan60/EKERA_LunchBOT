<template>
  <div class="p-6">
    <h2 class="text-3xl font-bold text-amber-900 mb-4 text-center">午餐醬後台</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-xl shadow-md border border-amber-200 flex flex-col justify-between items-start">
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
        <p class="text-sm text-amber-600 mt-2">啟用此選項以接收每日午餐醬推播隨機餐廳。</p>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-md border border-amber-200 flex flex-col justify-between">
        <h3 class="text-xl font-semibold text-amber-800 mb-4">管理辦公室</h3>
        <div class="flex flex-col sm:flex-row gap-3 w-full">
          <input v-model="newOffice" type="text" placeholder="輸入新辦公室名稱" class="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-amber-900 placeholder-amber-600" />
          <button @click="addOffice" class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition duration-200 flex-shrink-0">新增辦公室</button>
        </div>
        <p class="text-sm text-amber-600 mt-2">為您的群組新增不同辦公室地點，以便進行餐廳綁定。</p>
      </div>
    </div>
  </div>

  <div class="p-6">
    <h2 class="text-2xl font-bold text-amber-800 mb-4">餐廳設定面板</h2>

    <div class="mb-4 p-6 bg-white rounded-xl shadow-md border border-amber-200">
      <form @submit.prevent="createRestaurant" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input v-model="form.name" type="text" placeholder="餐廳名稱(必填欄位)" required class="border p-2 rounded-lg text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
        <input v-model="form.phone" type="text" placeholder="電話" class="border p-2 rounded-lg text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
        <input v-model="form.address" type="text" placeholder="地址" class="border p-2 rounded-lg col-span-2 text-amber-900 border-amber-300 placeholder-amber-600 focus:ring-2 focus:ring-amber-500 focus:border-transparent" />

        <!-- 檔案上傳區域 -->
        <div class="col-span-2">
          <label for="menu-upload" class="flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200 transition duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <span v-if="menuFiles.length > 0">已選擇 {{ menuFiles.length }} 張圖片</span>
            <span v-else>點我上傳菜單圖片（可多選5張）</span>
          </label>
          <input id="menu-upload" type="file" accept=".png, .jpg, .jpeg" multiple @change="handleFileChange" class="sr-only" ref="menuFileInput" />
          <div class="flex justify-between items-center mt-1">
            <p class="text-xs text-amber-600 ml-1">支援圖片jpg/png格式，最多上傳5張，每張最大2MB</p>
            <button v-if="menuFiles.length > 0" @click="removeAllMenuImages" type="button" class="text-xs text-red-500 hover:text-red-700 underline">清空所有圖片</button>
          </div>
        </div>

        <!-- 圖片預覽區域 -->
        <div v-if="menuPreviews.length > 0" class="col-span-2">
          <p class="text-sm text-amber-700 mb-3">菜單預覽（{{ menuPreviews.length }}/5）：</p>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="(preview, index) in menuPreviews" :key="index" class="relative border border-amber-300 rounded-lg overflow-hidden shadow-sm">
              <img :src="preview.src" :alt="`菜單預覽 ${index + 1}`" class="w-full h-48 object-cover" />
              <div class="absolute top-2 right-2">
                <button @click="removeMenuImage(index)" type="button" class="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-200 shadow-lg" title="移除圖片">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p class="text-xs truncate" :title="preview.name">{{ preview.name }}</p>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isLoading" class="col-span-2 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200">
          {{ isLoading ? '新增中...' : '新增餐廳' }}
        </button>
      </form>
    </div>
  </div>
  <div class="p-6">
    <!-- 餐廳清單區域 -->
    <div class="mb-8">
      <h3 class="text-2xl font-semibold text-amber-800 mb-6">餐廳綁定管理</h3>

      <div class="grid grid-cols-1 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-amber-200">
          <!-- 標題列和切換按鈕 -->
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-amber-800">所有餐廳清單</h4>

            <!-- 顯示模式切換按鈕 -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-amber-700">顯示模式：</span>
              <div class="flex bg-amber-100 rounded-lg p-1">
                <button @click="viewMode = 'single'" :class="['px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2', viewMode === 'single' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-200']">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <button @click="viewMode = 'double'" :class="['px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2', viewMode === 'double' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-200']">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h7M4 12h7M4 18h7M15 6h5M15 12h5M15 18h5"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 餐廳列表容器 -->
          <div class="max-h-96 overflow-y-auto">
            <!-- 單列模式 -->
            <div v-if="viewMode === 'single'" class="space-y-3">
              <div v-for="r in restaurants" :key="r._id" draggable="true" @dragstart="startDrag(r)" @dragend="endDrag" class="p-3 bg-amber-50 border border-amber-300 rounded-lg cursor-move hover:bg-amber-100 transition-colors duration-200" :class="{ 'opacity-50': isDragging && draggedRestaurant?._id === r._id }">
                <div class="flex items-center justify-between gap-3">
                  <!-- 餐廳基本資訊 -->
                  <div class="flex-1 min-w-0">
                    <div class="text-amber-900 mb-1 font-bold">{{ r.name }}</div>
                    <div class="text-sm text-amber-700 mb-2">
                      <div v-if="r.address">
                        <i class="fa-solid fa-location-dot fa-fw"></i>
                        {{ r.address }}
                      </div>
                      <div v-if="r.phone" class="mb-1">
                        <i class="fa-solid fa-phone fa-fw"></i>
                        {{ r.phone }}
                      </div>
                    </div>
                  </div>

                  <!-- 菜單圖片區域 -->
                  <div class="flex-shrink-0">
                    <div v-if="r.menu && r.menu.length > 0" class="relative">
                      <div class="relative group">
                        <img :src="r.menu[0]" alt="菜單預覽" class="w-20 h-20 object-cover rounded border border-amber-300 shadow cursor-pointer" @click="openImageModal(r)" />
                        <div v-if="r.menu.length > 1" class="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium shadow-md">
                          {{ r.menu.length }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="w-20 h-20 bg-amber-100 rounded border border-amber-300 flex items-center justify-center">
                      <span class="text-xs text-amber-600 text-center">無菜單圖片</span>
                    </div>
                  </div>

                  <!-- 操作按鈕 -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <div class="text-amber-400">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    </div>
                    <button @click="deleteRestaurant(r._id)" class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-sm cursor-pointer" aria-label="刪除餐廳">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 雙列模式 -->
            <div v-else-if="viewMode === 'double'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="r in restaurants" :key="r._id" draggable="true" @dragstart="startDrag(r)" @dragend="endDrag" class="p-3 bg-amber-50 border border-amber-300 rounded-lg cursor-move hover:bg-amber-100 transition-colors duration-200" :class="{ 'opacity-50': isDragging && draggedRestaurant?._id === r._id }">
                <!-- 緊湊版布局 -->
                <div class="space-y-3">
                  <!-- 餐廳名稱和操作按鈕 -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="text-amber-900 font-bold text-sm leading-tight flex-1">{{ r.name }}</div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <div class="text-amber-400">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                        </svg>
                      </div>
                      <button @click="deleteRestaurant(r._id)" class="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-sm cursor-pointer" aria-label="刪除餐廳">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- 圖片和資訊 -->
                  <div class="flex items-start gap-3">
                    <!-- 菜單圖片 -->
                    <div class="flex-shrink-0">
                      <div v-if="r.menu && r.menu.length > 0" class="relative">
                        <div class="relative group">
                          <img :src="r.menu[0]" alt="菜單預覽" class="w-16 h-16 object-cover rounded border border-amber-300 shadow cursor-pointer" @click="openImageModal(r)" />
                          <div v-if="r.menu.length > 1" class="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-md">
                            {{ r.menu.length }}
                          </div>
                        </div>
                      </div>
                      <div v-else class="w-16 h-16 bg-amber-100 rounded border border-amber-300 flex items-center justify-center">
                        <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>

                    <!-- 聯絡資訊 -->
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-amber-700 space-y-1">
                        <div v-if="r.address" class="line-clamp-2">
                          <i class="fa-solid fa-location-dot fa-fw"></i>
                          {{ r.address }}
                        </div>
                        <div v-if="r.phone" class="truncate">
                          <i class="fa-solid fa-phone fa-fw"></i>
                          {{ r.phone }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 無資料提示 -->
            <div v-if="restaurants.length === 0" class="text-amber-800 text-center py-8">尚無餐廳資料</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 辦公室清單區域 -->
    <div class="mb-8 p-6 bg-white rounded-xl shadow-md border border-amber-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-amber-800">辦公室清單與綁定餐廳</h3>
        <button @click="toggleAllOffices" class="px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition duration-200">
          {{ allOfficesExpanded ? '全部收合' : '全部展開' }}
        </button>
      </div>

      <div class="space-y-4">
        <div v-for="office in groupSetting.officeOption" :key="office" class="border border-amber-300 rounded-lg overflow-hidden">
          <!-- 辦公室標題列 -->
          <div class="flex items-center justify-between px-4 py-3 bg-amber-100 cursor-pointer hover:bg-amber-150 transition-colors duration-200" @click="toggleOffice(office)">
            <div class="flex items-center flex-1">
              <!-- 展開/收合圖示 -->
              <div class="mr-3 text-amber-600 transition-transform duration-200" :class="{ 'rotate-90': expandedOffices[office] }">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>

              <span class="text-lg font-medium" :class="{ 'font-bold text-amber-800': office === groupSetting.currentOffice, 'text-amber-700': office !== groupSetting.currentOffice }">
                {{ office }}
              </span>

              <!-- 綁定餐廳數量標示 -->
              <span class="ml-3 px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">{{ getOfficeRestaurants(office).length }} 家餐廳</span>

              <span v-if="office === groupSetting.currentOffice" class="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full shadow-sm">目前使用</span>
            </div>

            <div class="lg:flex items-center gap-2 space-y-2 lg:space-y-0" @click.stop>
              <div>
                <button
                  v-if="office !== groupSetting.currentOffice"
                  @click="
                    groupSetting.currentOffice = office;
                    saveSetting();
                  "
                  class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition duration-200"
                >
                  設為預設
                </button>
              </div>
              <div>
                <button @click="removeOffice(office)" v-if="office !== groupSetting.currentOffice" class="bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 rounded-lg font-medium transition duration-200">刪除辦公室</button>
              </div>
            </div>
          </div>
          <!-- 辦公室內容區域（可收合） -->
          <div v-show="expandedOffices[office]" class="transition-all duration-300 ease-in-out">
            <div
              class="p-4 min-h-24"
              :class="{
                'border-amber-600 bg-amber-50 ring-2 ring-amber-300': dragOverOffice === office,
                'bg-white': dragOverOffice !== office,
              }"
              @dragover.prevent="dragOverOffice = office"
              @dragleave="dragOverOffice = null"
              @drop="dropRestaurant(office)"
            >
              <div v-if="getOfficeRestaurants(office).length === 0" class="text-center text-gray-400 py-8">
                <div class="mb-2">
                  <svg class="w-12 h-12 mx-auto text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <div class="text-sm text-amber-700 font-medium">拖拉餐廳到這裡進行綁定</div>
                <div class="text-xs mt-1 text-amber-600">支援從上方餐廳清單拖拉</div>
              </div>

              <div v-else class="space-y-3">
                <div v-for="binding in getOfficeRestaurants(office)" :key="binding._id" class="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                  <!-- 啟用/停用按鈕 -->
                  <div class="flex-shrink-0">
                    <button @click="toggleOfficeRestaurant(binding)" :class="binding.isActiveInOffice ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'" class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-200">
                      {{ binding.isActiveInOffice ? '✓ 啟用' : '✗ 停用' }}
                    </button>
                  </div>

                  <!-- 餐廳資訊 -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-amber-900 mb-1">
                      {{ binding.restaurantId?.name || '未知餐廳' }}
                    </div>
                    <div class="text-xs text-amber-700 space-y-1">
                      <div v-if="binding.restaurantId?.address">
                        <i class="fa-solid fa-location-dot fa-fw"></i>
                        {{ binding.restaurantId.address }}
                      </div>
                      <div v-if="binding.restaurantId?.phone">
                        <i class="fa-solid fa-phone fa-fw"></i>
                        {{ binding.restaurantId.phone }}
                      </div>
                    </div>
                  </div>

                  <!-- 菜單圖片預覽 -->
                  <div class="flex-shrink-0" v-if="binding.restaurantId?.menu?.length > 0">
                    <div class="relative">
                      <img :src="binding.restaurantId.menu[0]" alt="菜單預覽" class="w-12 h-12 object-cover rounded border border-amber-300 cursor-pointer hover:scale-105 transition-transform duration-200" @click="openImageModal(binding.restaurantId)" />
                      <div v-if="binding.restaurantId.menu.length > 1" class="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                        {{ binding.restaurantId.menu.length }}
                      </div>
                    </div>
                  </div>

                  <!-- 移除按鈕 -->
                  <div class="flex-shrink-0">
                    <button @click="removeOfficeRestaurant(binding._id)" class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-sm cursor-pointer" title="移除餐廳綁定">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupSetting.officeOption.length === 0" class="text-center text-gray-500 py-12">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <div class="font-medium text-gray-600">目前沒有辦公室</div>
          <div class="text-sm text-gray-500">請先新增辦公室以便管理餐廳綁定</div>
        </div>
      </div>
    </div>

    <!-- 圖片彈窗 Modal -->
    <div v-if="imageModal.show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click="closeImageModal">
      <div class="bg-white rounded-lg w-full max-w-[95vw] max-h-[95vh] overflow-hidden" @click.stop>
        <div class="flex items-center justify-between p-6 border-b">
          <h3 class="text-xl font-semibold text-amber-800">{{ imageModal.restaurant?.name }} - 菜單圖片</h3>
          <button @click="closeImageModal" class="text-gray-500 hover:text-gray-700 p-1 cursor-pointer">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 max-h-[calc(95vh-80px)] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(image, index) in imageModal.restaurant?.menu" :key="index" class="relative group">
              <img :src="image" :alt="`${imageModal.restaurant?.name} 菜單 ${index + 1}`" class="w-full h-auto aspect-[3/2] object-cover rounded-lg border border-gray-200 shadow-sm" />
              <div class="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">{{ index + 1 }} / {{ imageModal.restaurant?.menu?.length }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const viewMode = ref('single');
// ✅ 接收 prop
const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
});
const groupId = props.groupId;

// ✅ 檢查 groupId 是否存在
if (!groupId) {
  toast.error('找不到 groupId！網址應包含 ?groupId=xxx');
  throw new Error('Missing groupId in props');
}

const API_PATH = import.meta.env.VITE_API_PATH || '';
const API_Route = 'group-setting';
const isLoading = ref(false);

// ✅ 群組設定資料
const groupSetting = reactive({
  groupId,
  lunchNotification: true,
  currentOffice: '',
  officeOption: [],
});

const newOffice = ref('');

// ✅ 餐廳表單與清單
const restaurants = ref([]);
const form = ref({ name: '', phone: '', address: '', tags: '' });

// ✅ 多張圖片上傳處理
const menuFiles = ref([]); // 改為陣列存儲多個檔案
const menuPreviews = ref([]); // 改為陣列存儲多個預覽

const handleFileChange = (e) => {
  const files = Array.from(e.target.files); // 轉換為陣列

  // 檢查檔案數量限制（最多5張）
  if (menuFiles.value.length + files.length > 5) {
    toast.error('最多只能上傳5張圖片');
    return;
  }

  files.forEach((file) => {
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} 不是有效的圖片檔案`);
      return;
    }

    // 檢查檔案大小（例如：限制5MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`${file.name} 檔案過大，請選擇小於2MB的圖片`);
      return;
    }

    menuFiles.value.push(file);

    // 產生預覽
    const reader = new FileReader();
    reader.onload = (e) => {
      menuPreviews.value.push({
        src: e.target.result,
        name: file.name,
        index: menuFiles.value.length - 1,
      });
    };
    reader.readAsDataURL(file);
  });

  // 清空 input，允許重複選擇相同檔案
  e.target.value = '';
};

const removeMenuImage = (index) => {
  menuFiles.value.splice(index, 1);
  menuPreviews.value.splice(index, 1);

  // 重新索引預覽陣列
  menuPreviews.value.forEach((preview, i) => {
    preview.index = i;
  });
};

const removeAllMenuImages = () => {
  menuFiles.value = [];
  menuPreviews.value = [];
};

// ✅ 新增：拖拉功能相關變數
const isDragging = ref(false);
const draggedRestaurant = ref(null);
const dragOverOffice = ref(null);
const officeRestaurants = ref([]); // 辦公室餐廳綁定清單

// -------------------- 群組設定 --------------------

async function fetchGroupSetting() {
  isLoading.value = true;
  try {
    const { data } = await axios.get(`${API_PATH}/${API_Route}/${groupId}`);
    groupSetting.lunchNotification = data.lunchNotification;
    groupSetting.currentOffice = data.currentOffice;
    groupSetting.officeOption = data.officeOption;
  } catch {
    toast.warning('找不到群組設定');
  } finally {
    isLoading.value = false;
  }
}

async function saveSetting() {
  isLoading.value = true;
  const payload = {
    groupId,
    lunchNotification: groupSetting.lunchNotification,
    currentOffice: groupSetting.currentOffice,
    officeOption: groupSetting.officeOption,
  };

  try {
    await axios.put(`${API_PATH}/${API_Route}/${groupId}`, payload);
    toast.success('設定已更新！');
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        await axios.post(`${API_PATH}/${API_Route}`, payload);
        toast.success('新群組設定已建立！');
      } catch (postErr) {
        toast.error('建立群組失敗：' + postErr.message);
      }
    } else {
      toast.error('更新失敗：' + err.message);
    }
  } finally {
    isLoading.value = false;
  }
}

function addOffice() {
  const trimmed = newOffice.value.trim();
  if (!trimmed) return toast.info('辦公室名稱不能為空。');
  if (groupSetting.officeOption.includes(trimmed)) return toast.info('辦公室名稱已存在。');

  groupSetting.officeOption.push(trimmed);
  newOffice.value = '';
  saveSetting();
}

function removeOffice(officeName) {
  if (officeName === groupSetting.currentOffice) {
    toast.warning('無法刪除目前正在使用的辦公室');
    return;
  }
  groupSetting.officeOption = groupSetting.officeOption.filter((o) => o !== officeName);
  saveSetting();
}

// -------------------- 餐廳設定 --------------------

async function fetchRestaurants() {
  if (!groupId) return;
  isLoading.value = true;
  try {
    const { data } = await axios.get(`${API_PATH}/restaurant?groupId=${groupId}`);
    restaurants.value = data;
  } catch (err) {
    toast.error(err.data?.message || '餐廳資料讀取失敗');
  } finally {
    isLoading.value = false;
  }
}

const createRestaurant = async () => {
  if (!form.value.name) {
    toast.error('請填寫餐廳名稱');
    return;
  }

  try {
    isLoading.value = true;
    const formData = new FormData();
    formData.append('groupId', groupId);
    formData.append('name', form.value.name);
    formData.append('phone', form.value.phone || '');
    formData.append('address', form.value.address || '');
    formData.append('tags', JSON.stringify(form.value.tags || []));

    // 添加所有菜單圖片
    menuFiles.value.forEach((file) => {
      formData.append('menu', file);
    });

    await axios.post(`${API_PATH}/restaurant`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.success('新增成功');
    await fetchRestaurants();

    // 重置表單
    form.value = { name: '', phone: '', address: '', tags: [] };
    menuFiles.value = [];
    menuPreviews.value = [];
  } catch (err) {
    console.log(err);
    toast.error('新增失敗');
  } finally {
    isLoading.value = false;
  }
};

async function deleteRestaurant(id) {
  if (!confirm('確定要刪除這間餐廳嗎？')) return;
  try {
    await axios.delete(`${API_PATH}/restaurant/${id}`, { data: { groupId } });
    restaurants.value = restaurants.value.filter((r) => r._id !== id);
    await fetchOfficeRestaurants();
    toast.success('刪除成功');
  } catch (err) {
    toast.error(err.data?.message || '刪除失敗');
  }
}

// -------------------- 新增：拖拉綁定功能 --------------------

// 取得指定辦公室的餐廳清單
function getOfficeRestaurants(office) {
  return officeRestaurants.value.filter((binding) => binding.office === office);
}

// 開始拖拉
function startDrag(restaurant) {
  isDragging.value = true;
  draggedRestaurant.value = restaurant;
}

// 結束拖拉
function endDrag() {
  isDragging.value = false;
  dragOverOffice.value = null;
}

// 放下餐廳到辦公室
async function dropRestaurant(office) {
  if (!draggedRestaurant.value) return;
  dragOverOffice.value = null;
  try {
    // 檢查是否已經綁定
    const existing = officeRestaurants.value.find((binding) => binding.office === office && binding.restaurantId._id === draggedRestaurant.value._id);

    if (existing) {
      toast.info('此餐廳已綁定到該辦公室');
      return;
    }
    isLoading.value = true;
    await axios.post(`${API_PATH}/group-restaurant`, {
      groupId,
      office,
      restaurantId: draggedRestaurant.value._id,
      isActiveInOffice: true,
    });
    toast.success(`已將 ${draggedRestaurant.value.name} 綁定到 ${office}`);

    // 重新載入綁定清單
    await fetchOfficeRestaurants();
  } catch (err) {
    console.error('綁定失敗:', err);
    toast.error(err.response?.data?.error || '綁定失敗');
  } finally {
    isLoading.value = false;
    endDrag();
  }
}

// 載入辦公室餐廳綁定清單
async function fetchOfficeRestaurants() {
  if (!groupId) return;

  try {
    const { data } = await axios.get(`${API_PATH}/group-restaurant/${groupId}`);
    officeRestaurants.value = data;
  } catch (err) {
    console.error('載入辦公室餐廳清單失敗:', err);
    toast.error('載入辦公室餐廳清單失敗');
  }
}

// 切換辦公室餐廳狀態
async function toggleOfficeRestaurant(binding) {
  try {
    await axios.put(`${API_PATH}/group-restaurant/${binding._id}`, {
      isActiveInOffice: !binding.isActiveInOffice,
    });

    binding.isActiveInOffice = !binding.isActiveInOffice;
    toast.success('狀態已更新');
  } catch (err) {
    console.error('切換辦公室餐廳狀態失敗:', err);
    toast.error('狀態更新失敗');
  }
}

// 移除辦公室餐廳綁定
async function removeOfficeRestaurant(bindingId) {
  if (!confirm('確定要移除此餐廳綁定嗎？')) return;

  try {
    await axios.delete(`${API_PATH}/group-restaurant/${bindingId}`);

    // 從清單中移除
    officeRestaurants.value = officeRestaurants.value.filter((binding) => binding._id !== bindingId);
    await fetchOfficeRestaurants();

    toast.success('已移除綁定');
  } catch (err) {
    console.error('移除辦公室餐廳綁定失敗:', err);
    toast.error('移除失敗');
  }
}

// -------------------- 初始化 --------------------

onMounted(() => {
  fetchGroupSetting();
  fetchRestaurants();
  fetchOfficeRestaurants();
});

const expandedOffices = ref({});
const allOfficesExpanded = computed(() => {
  return Object.values(expandedOffices.value).every((expanded) => expanded);
});

// 圖片彈窗管理
const imageModal = reactive({
  show: false,
  restaurant: null,
});

// 初始化辦公室展開狀態
const initializeOfficeStates = () => {
  groupSetting.officeOption.forEach((office) => {
    if (!(office in expandedOffices.value)) {
      if (groupSetting.currentOffice === office) {
        expandedOffices.value[office] = true; // 預設展開
      } else {
        expandedOffices.value[office] = false; // 預設關閉
      }
    }
  });
};

// 切換單個辦公室展開狀態
const toggleOffice = (office) => {
  expandedOffices.value[office] = !expandedOffices.value[office];
};

// 切換所有辦公室展開狀態
const toggleAllOffices = () => {
  const shouldExpand = !allOfficesExpanded.value;
  groupSetting.officeOption.forEach((office) => {
    expandedOffices.value[office] = shouldExpand;
  });
};

// 打開圖片彈窗
const openImageModal = (restaurant) => {
  imageModal.restaurant = restaurant;
  imageModal.show = true;
  document.body.style.overflow = 'hidden'; // 防止背景滾動
};

// 關閉圖片彈窗
const closeImageModal = () => {
  imageModal.show = false;
  imageModal.restaurant = null;
  document.body.style.overflow = 'auto';
};

// 在組件掛載時初始化
onMounted(() => {
  initializeOfficeStates();
});

// 監聽辦公室選項變化
watch(
  () => groupSetting.officeOption,
  () => {
    initializeOfficeStates();
  },
  { deep: true },
);
</script>
