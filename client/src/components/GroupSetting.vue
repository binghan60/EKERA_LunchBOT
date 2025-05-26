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

        <div class="col-span-2">
          <label for="menu-upload" class="flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-lg cursor-pointer hover:bg-amber-200 transition duration-200">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            <span v-if="form.menuFile">已選擇檔案：{{ form.menuFile.name }}</span>
            <span v-else>點我上傳菜單圖片</span>
          </label>
          <input id="menu-upload" type="file" accept=".png, .jpg, .jpeg" @change="handleFileChange" class="sr-only" ref="menuFileInput" />
          <p class="text-xs text-amber-600 mt-1 ml-1">支援圖片jpg/png格式，建議上傳清晰的菜單圖。</p>
        </div>

        <div v-if="menuPreview" class="col-span-2 flex flex-col items-center">
          <p class="text-sm text-amber-700 mb-2">菜單預覽：</p>
          <img :src="menuPreview" alt="菜單預覽" class="max-w-md border border-amber-300 rounded shadow mb-3" />
          <button @click="removeMenuImage" type="button" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-sm cursor-pointer">移除圖片</button>
        </div>

        <button type="submit" class="col-span-2 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700">新增餐廳</button>
      </form>
    </div>
  </div>
  <div class="p-6">
    <div class="mb-8">
      <h3 class="text-2xl font-semibold text-amber-800 mb-6">餐廳綁定管理</h3>

      <div class="grid grid-cols-1 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-md border border-amber-200">
          <h4 class="text-lg font-semibold text-amber-800 mb-4">所有餐廳清單</h4>
          <div class="max-h-96 overflow-y-auto space-y-3">
            <div v-for="r in restaurants" :key="r._id" draggable="true" @dragstart="startDrag(r)" @dragend="endDrag" class="p-2 bg-amber-50 border border-amber-300 rounded-lg cursor-move hover:bg-amber-100 transition-colors duration-200" :class="{ 'opacity-50': isDragging && draggedRestaurant?._id === r._id }">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="font-medium text-amber-900">{{ r.name }}</div>
                  <div class="text-sm text-amber-700">{{ r.phone || '無電話' }}｜{{ r.address || '無地址' }}</div>
                </div>
                <div>
                  <img v-if="r.menu[0]" :src="r.menu[0]" alt="菜單預覽" class="max-h-24 rounded border border-amber-300 shadow" />
                  <p class="text-sm text-amber-700" v-else>無上傳菜單</p>
                </div>
                <div class="flex items-center gap-2 ml-2">
                  <div class="text-amber-400">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                    </svg>
                  </div>
                  <button @click="deleteRestaurant(r._id)" class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 shadow-sm cursor-pointer" aria-label="刪除餐廳">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="restaurants.length === 0" class="text-amber-800 text-center py-8">尚無餐廳資料</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8 p-6 bg-white rounded-xl shadow-md border border-amber-200">
      <h3 class="text-xl font-semibold text-amber-800 mb-4">辦公室清單與綁定餐廳</h3>

      <div class="space-y-6">
        <div v-for="office in groupSetting.officeOption" :key="office" class="border border-amber-300 rounded-lg">
          <div class="flex items-center justify-between px-4 py-3 bg-amber-100 rounded-t-lg">
            <div class="flex items-center">
              <span class="mr-3 text-lg font-medium" :class="{ 'font-bold text-amber-800': office === groupSetting.currentOffice, 'text-amber-700': office !== groupSetting.currentOffice }">
                {{ office }}
              </span>
              <span v-if="office === groupSetting.currentOffice" class="px-2 py-0.5 bg-amber-600 text-white text-xs font-semibold rounded-full shadow-sm">目前使用</span>
              <button
                v-else
                @click="
                  groupSetting.currentOffice = office;
                  saveSetting();
                "
                class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition duration-200"
              >
                設為預設
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button @click="removeOffice(office)" v-if="office !== groupSetting.currentOffice" class="text-sm text-red-600 hover:text-red-800 font-medium transition duration-200">刪除</button>
            </div>
          </div>

          <div class="p-4 min-h-24" :class="{ 'border-amber-600 bg-amber-50 ring-2 ring-amber-300': dragOverOffice === office, 'bg-white': dragOverOffice !== office }" @dragover.prevent="dragOverOffice = office" @dragleave="dragOverOffice = null" @drop="dropRestaurant(office)">
            <div v-if="getOfficeRestaurants(office).length === 0" class="text-center text-gray-400 py-4">
              <div class="text-sm text-amber-700">拖拉餐廳到這裡進行綁定</div>
              <div class="text-xs mt-1 text-amber-700">支援拖拉所有餐廳清單</div>
            </div>

            <div v-else class="space-y-2">
              <div v-for="binding in getOfficeRestaurants(office)" :key="binding._id" class="flex items-center justify-between bg-amber-50 p-2 rounded-lg border border-amber-200">
                <div>
                  <button @click="toggleOfficeRestaurant(binding)" :class="binding.isActiveInOffice ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'" class="px-2 py-1 mx-1 rounded text-xs cursor-pointer">
                    {{ binding.isActiveInOffice ? '啟用' : '停用' }}
                  </button>
                </div>
                <div class="flex-1">
                  <div class="font-medium text-sm text-amber-900">
                    {{ binding.restaurantId?.name || '未知餐廳' }}
                  </div>
                  <div class="text-xs text-amber-700">
                    <i class="fa-solid fa-location-dot fa-fw"></i>
                    {{ binding.restaurantId?.address || '未設定地址' }}
                    <span class="mx-2">|</span>
                    <i class="fa-solid fa-phone fa-fw"></i>
                    {{ binding.restaurantId?.phone || '未設定電話' }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="removeOfficeRestaurant(binding._id)" class="text-red-600 hover:text-red-800 text-sm">移除</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupSetting.officeOption.length === 0" class="text-center text-gray-500 py-8">目前沒有辦公室，請先新增辦公室。</div>
      </div>
    </div>

    <VueLoading :active="isLoading" :is-full-page="true" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import VueLoading from 'vue-loading-overlay';

const toast = useToast();

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
// ✅ 上傳圖片處理
const menuFile = ref(null);
const menuPreview = ref(null);
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  menuFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    menuPreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removeMenuImage = () => {
  menuFile.value = null;
  menuPreview.value = null;
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

function removeTag(index) {
  form.value.tags.splice(index, 1);
}

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
    if (menuFile.value) {
      formData.append('menu', menuFile.value);
    }
    await axios.post(`${API_PATH}/restaurant`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.success('新增成功');
    await fetchRestaurants();
    form.value = { name: '', phone: '', address: '', tags: [] };
    menuFile.value = null;
    menuPreview.value = null;
  } catch (err) {
    console.log(err);
    toast.error('新增失敗');
  } finally {
    isLoading.value = false;
  }
};

async function toggleActive(r) {
  try {
    await axios.put(`${API_PATH}/restaurant/${r._id}`, { groupId, isActive: !r.isActive });
    r.isActive = !r.isActive;
    toast.success('狀態已更新');
  } catch (err) {
    toast.error(err.data?.message || '更新失敗');
  }
}

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
    toast.error('移除失敗');
  }
}

// -------------------- 初始化 --------------------

onMounted(() => {
  fetchGroupSetting();
  fetchRestaurants();
  fetchOfficeRestaurants();
});
</script>
