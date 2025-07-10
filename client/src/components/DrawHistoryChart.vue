<template>
  <div class="p-5 border border-gray-200 rounded-lg bg-white shadow-md">
    <h2 class="text-xl font-bold mb-4 text-gray-800">抽獎歷史分布</h2>
    <div class="mb-4 flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
      <button @click="fetchChartData('week')" :class="{ '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700': timeRange === 'week' }" class="px-4 py-2 border border-gray-300 bg-gray-50 cursor-pointer rounded-md transition-all duration-200 text-sm text-gray-700 hover:bg-gray-100">最近一周</button>
      <button @click="fetchChartData('month')" :class="{ '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700': timeRange === 'month' }" class="px-4 py-2 border border-gray-300 bg-gray-50 cursor-pointer rounded-md transition-all duration-200 text-sm text-gray-700 hover:bg-gray-100">最近一個月</button>
    </div>
    <div v-if="loading" class="text-center py-10 text-gray-500 text-base">載入中...</div>
    <div v-else-if="errorState" class="text-red-700 bg-red-100 border border-red-300 rounded-md p-4 my-2 text-center text-base">{{ errorState }}</div>
    <div v-else-if="noData" class="text-center py-10 text-gray-500 text-base">此區間內沒有抽獎紀錄</div>
    <!-- 修正：使用正確的組件名稱 -->
    <Chart v-if="chartOptions" :options="chartOptions"></Chart>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Chart } from 'highcharts-vue';
import Highcharts from 'highcharts';
import axios from 'axios';

// 設定 Highcharts 語言配置
Highcharts.setOptions({
  lang: {
    thousandsSep: ',',
    decimalPoint: '.',
    loading: '載入中...',
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    resetZoom: '重置縮放',
    resetZoomTitle: '重置縮放 1:1',
    printChart: '列印圖表',
    downloadPNG: '下載 PNG',
    downloadJPEG: '下載 JPEG',
    downloadPDF: '下載 PDF',
    downloadSVG: '下載 SVG',
    contextButtonTitle: '圖表選單'
  }
});

// Props definition
const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
});

// Use a separate ref for chart options and update it completely
// to ensure reactivity triggers a re-render.
const chartOptions = ref(null); 

const loading = ref(false);
const timeRange = ref('week'); // 'week' or 'month'
const errorState = ref(null);
const noData = ref(false);

const fetchChartData = async (range) => {
  errorState.value = null;
  noData.value = false;
  if (!props.groupId) return;

  loading.value = true;
  timeRange.value = range;

  const endDate = new Date();
  const startDate = new Date();

  if (range === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else { // month
    startDate.setDate(endDate.getDate() - 30);
  }

  const formatDate = (date) => date.toISOString().split('T')[0];

  try {
    const apiUrl = `${import.meta.env.VITE_API_PATH}/history`;
    const response = await axios.get(apiUrl, {
      params: {
        groupId: props.groupId,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      },
    });

    const statistics = response.data.statistics || [];
    
    if (statistics.length === 0) {
      noData.value = true;
      chartOptions.value = null; // Clear previous chart
      return;
    }

    const chartData = statistics.map(item => ({
      name: item.restaurantName,
      y: item.count,
    }));

    // Re-create the options object to trigger Highcharts update
    chartOptions.value = {
      chart: {
        type: 'pie',
        height: 400, // 添加固定高度
      },
      title: {
        text: `抽獎次數分布 (${range === 'week' ? '最近一周' : '最近一個月'})`,
        style: {
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b> ({point.y} 次)',
        useHTML: true
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f}%',
            style: {
              fontSize: '12px'
            }
          },
          showInLegend: true,
        },
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal'
      },
      series: [
        {
          name: '抽中次數',
          colorByPoint: true,
          data: chartData,
        },
      ],
      credits: {
        enabled: false
      },
      // 明確設定語言環境
      lang: {
        thousandsSep: ',',
        decimalPoint: '.'
      },
      // 添加響應式配置
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    };

  } catch (error) {
    console.error('Failed to fetch draw history:', error);
    errorState.value = '無法載入資料，請檢查網路連線或聯繫系統管理員。';
  } finally {
    loading.value = false;
  }
};

// Watch for groupId changes
watch(() => props.groupId, (newGroupId) => {
  if (newGroupId) {
    fetchChartData(timeRange.value);
  }
}, { immediate: true });

</script>