<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFeedbackStore } from '../stores/feedback'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const feedbackStore = useFeedbackStore()
const visibleDatasets = ref(['geral'])
interface ChartDataset {
  id: string;
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  hidden: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const chartData = ref<ChartData | null>(null);

const useFilteredData = computed(() => 
  feedbackStore.filteredData.length > 0 ? feedbackStore.filteredData : feedbackStore.feedbackData
)

const promoters = computed(() => 
  useFilteredData.value.filter(f => f.score >= 9).length
)

const neutrals = computed(() => 
  useFilteredData.value.filter(f => f.score >= 7 && f.score <= 8).length
)

const detractors = computed(() => 
  useFilteredData.value.filter(f => f.score <= 6).length
)

const calculateNPSForRole = (data: any[], role: string | null = null) => {
  const filteredData = role ? data.filter(f => f.role === role) : data
  const total = filteredData.length
  if (total === 0) return 0
  const promoters = filteredData.filter(f => f.score >= 9).length
  const detractors = filteredData.filter(f => f.score <= 6).length
  const nps = ((promoters - detractors) / total * 100)
  return Math.max(0, Number(nps.toFixed(2)))
}

const npsPerRole = computed(() => ({
  agent: calculateNPSForRole(useFilteredData.value, 'agent'),
  manager: calculateNPSForRole(useFilteredData.value, 'manager'),
  supervisor: calculateNPSForRole(useFilteredData.value, 'supervisor')
}))

const datasetConfigs = [
  {
    id: 'geral',
    label: 'Geral',
    role: null,
    color: '#2563eb'
  },
  {
    id: 'gestor',
    label: 'Gestor',
    role: 'manager',
    color: '#16a34a'
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    role: 'supervisor',
    color: '#9333ea'
  },
  {
    id: 'agente',
    label: 'Agente',
    role: 'agent',
    color: '#dc2626'
  }
]

const updateChartData = () => {
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, 'MMM yyyy', { locale: ptBR })
    }
  }).reverse()

  const datasets = datasetConfigs.map(config => ({
    id: config.id,
    label: config.label,
    data: last12Months.map(month => {
      const monthData = useFilteredData.value.filter(f => {
        const date = parseISO(f.created_at)
        return date >= month.start && date <= month.end
      })
      return calculateNPSForRole(monthData, config.role)
    }),
    borderColor: config.color,
    backgroundColor: config.color,
    tension: 0.4,
    hidden: !visibleDatasets.value.includes(config.id)
  }))

  return {
    labels: last12Months.map(month => month.label),
    datasets
  }
}

watch([useFilteredData, visibleDatasets], () => {
  chartData.value = updateChartData()
}, { immediate: true })

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: 'NPS Score'
      }
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Cards principais -->
    <div class="grid grid-cols-2 gap-6">
      <!-- Card NPS -->
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-2xl font-medium mb-8">NPS</h3>
        <div class="grid grid-cols-3 gap-x-16">
          <div>
            <p class="text-gray-600 text-lg mb-2">Agente</p>
            <p class="text-blue-600 text-3xl">{{ npsPerRole?.agent || 0 }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-lg mb-2">Supervisor</p>
            <p class="text-blue-600 text-3xl">{{ npsPerRole?.supervisor || 0 }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-lg mb-2">Gestor</p>
            <p class="text-blue-600 text-3xl">{{ npsPerRole?.manager || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Card Tipos de usuários -->
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-2xl font-medium mb-8">Tipos de usuários</h3>
        <div class="grid grid-cols-3 gap-x-16">
          <div>
            <p class="text-gray-600 text-lg mb-2">Promotores</p>
            <p class="text-blue-600 text-3xl">{{ promoters }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-lg mb-2">Neutros</p>
            <p class="text-blue-600 text-3xl">{{ neutrals }}</p>
          </div>
          <div>
            <p class="text-gray-600 text-lg mb-2">Detratores</p>
            <p class="text-blue-600 text-3xl">{{ detractors }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico Evolução do NPS -->
    <div class="bg-white rounded-lg p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-medium">Evolução do NPS</h3>
        <div class="flex items-center gap-4">
          <template v-for="config in datasetConfigs" :key="config.id">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="visibleDatasets"
                :value="config.id"
                class="h-4 w-4 rounded border-gray-300"
                :class="`text-[${config.color}]`"
              />
              <span class="text-sm font-medium text-gray-700">{{ config.label }}</span>
            </label>
          </template>
        </div>
      </div>
      <div class="h-[400px]">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>