<template>
  <div class="draw-history-chart">
    <h2>抽獎歷史分布</h2>
    <div class="time-range-selector">
      <button @click="fetchChartData('week')" :class="{ active: timeRange === 'week' }">最近一周</button>
      <button @click="fetchChartData('month')" :class="{ active: timeRange === 'month' }">最近一個月</button>
    </div>
    <div v-if="loading" class="loading-spinner">載入中...</div>
    <div v-else-if="errorState" class="error-message">{{ errorState }}</div>
    <div v-else-if="noData" class="no-data">此區間內沒有抽獎紀錄</div>
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

<style scoped>
.draw-history-chart {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-top: 20px;
  background-color: #fff;
}

.time-range-selector {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.time-range-selector button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.time-range-selector button:hover {
  background-color: #e9ecef;
}

.time-range-selector button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.loading-spinner, .no-data, .error-message {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 16px;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin: 10px 0;
}

.loading-spinner {
  position: relative;
}

.loading-spinner::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  margin: auto;
  border: 2px solid transparent;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 響應式設計 */
@media (max-width: 768px) {
  .draw-history-chart {
    padding: 15px;
  }
  
  .time-range-selector {
    flex-direction: column;
  }
  
  .time-range-selector button {
    width: 100%;
  }
}
</style>