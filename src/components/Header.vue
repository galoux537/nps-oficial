<script setup lang="ts">
import { ref, computed } from 'vue'
import Papa from 'papaparse'
import { useFeedbackStore, type FeedbackData } from '../stores/feedback'

const feedbackStore = useFeedbackStore()
const fileInput = ref<HTMLInputElement | null>(null)
const selectedPeriod = ref('all')
const selectedRoles = ref<string[]>([])
const selectedScores = ref<number[]>([])
const uploadError = ref('')
const showTable = ref(false)
const isRolesOpen = ref(false)
const isScoresOpen = ref(false)
const searchPerformed = ref(false)

const allRoles = ['agent', 'manager', 'supervisor']
const allScores = Array.from({ length: 10 }, (_, i) => i + 1)

const allRolesSelected = computed(() => selectedRoles.value.length === allRoles.length)
const allScoresSelected = computed(() => selectedScores.value.length === allScores.length)

const toggleAllRoles = () => {
  selectedRoles.value = allRolesSelected.value ? [] : [...allRoles]
}

const toggleAllScores = () => {
  selectedScores.value = allScoresSelected.value ? [] : [...allScores]
}

const periods = [
  { value: 'all', label: 'Todo Período' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Último Mês' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'year', label: 'Último Ano' }
]

// Computed properties para calcular contagens reais
const roleCounts = computed(() => {
  const counts = {
    agent: 0,
    manager: 0,
    supervisor: 0
  }
  
  if (feedbackStore.feedbackData.length === 0) {
    return counts
  }
  
  feedbackStore.feedbackData.forEach(item => {
    if (counts.hasOwnProperty(item.role)) {
      counts[item.role as keyof typeof counts]++
    }
  })
  
  return counts
})

// Computed property para contagem de scores
const scoreCounts = computed(() => {
  const counts = Array(11).fill(0)
  
  if (feedbackStore.feedbackData.length === 0) {
    return counts
  }
  
  feedbackStore.feedbackData.forEach(item => {
    if (item.score >= 1 && item.score <= 10) {
      counts[item.score]++
    }
  })
  return counts
})

const roles = computed(() => [
  { value: 'agent', label: 'Agente', count: `${roleCounts.value.agent} respostas` },
  { value: 'manager', label: 'Gestor', count: `${roleCounts.value.manager} respostas` },
  { value: 'supervisor', label: 'Supervisor', count: `${roleCounts.value.supervisor} respostas` }
])

const scores = computed(() => 
  Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString(),
    count: `${scoreCounts.value[i + 1]} respostas`
  }))
)

const toggleRoles = () => {
  isRolesOpen.value = !isRolesOpen.value
  if (isRolesOpen.value) isScoresOpen.value = false
}

const toggleScores = () => {
  isScoresOpen.value = !isScoresOpen.value
  if (isScoresOpen.value) isRolesOpen.value = false
}

const handleScoreToggle = (score: number) => {
  const index = selectedScores.value.indexOf(score)
  if (index === -1) {
    selectedScores.value.push(score)
  } else {
    selectedScores.value.splice(index, 1)
  }
}

const handleRoleToggle = (role: string) => {
  const index = selectedRoles.value.indexOf(role)
  if (index === -1) {
    selectedRoles.value.push(role)
  } else {
    selectedRoles.value.splice(index, 1)
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-container')) {
    isRolesOpen.value = false
    isScoresOpen.value = false
  }
}

const handleUploadClick = () => {
  uploadError.value = ''
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    feedbackStore.isLoading = true
    uploadError.value = ''
    
    Papa.parse(file, {
      complete: (results) => {
        try {
          const processedData = results.data.map((row: any) => ({
            user_id: String(row.user_id || ''),
            score: Number(row.score) || 0,
            reason: String(row.reason || ''),
            created_at: String(row.created_at || new Date().toISOString()),
            company_id: String(row.company_id || ''),
            role: String(row.role || 'não especificado')
          }))
          
          feedbackStore.addFeedbackData(processedData)
          resetFilters()
          console.log('Dados importados com sucesso:', processedData)
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          uploadError.value = 'Erro ao processar o arquivo. Verifique o formato dos dados.'
        } finally {
          feedbackStore.isLoading = false
        }
      },
      error: (error) => {
        console.error('Erro ao fazer parse do arquivo:', error)
        uploadError.value = 'Erro ao ler o arquivo. Verifique se é um CSV válido.'
        feedbackStore.isLoading = false
      },
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim()
    })
  }
  
  if (target) target.value = ''
}

const hasActiveFilters = computed(() => {
  return selectedPeriod.value !== 'all' || 
         selectedRoles.value.length > 0 || 
         selectedScores.value.length > 0
})

const resetFilters = () => {
  selectedPeriod.value = 'all'
  selectedRoles.value = []
  selectedScores.value = []
  showTable.value = false
  feedbackStore.filterFeedback('all', [], [])
}

const handleSearch = () => {
  feedbackStore.filterFeedback(selectedPeriod.value, selectedRoles.value, selectedScores.value)
}
</script>

<template>
  <header class="bg-white border-b border-gray-200" @click="handleClickOutside">
    <div class="px-4 md:px-6 py-4">
      <div class="flex items-center justify-between mb-4">
        <!-- Mobile menu button -->
        <button
          class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100"
          @click="$emit('toggle-sidebar')"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h2 class="text-lg font-medium text-gray-800">
          {{ $route.name || 'Dashboard' }}
        </h2>
        
        <div class="flex items-center space-x-4">
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileChange"
          />
          <button 
            class="btn btn-primary relative"
            @click="handleUploadClick"
            :disabled="feedbackStore.isLoading"
          >
            <span :class="{ 'opacity-0': feedbackStore.isLoading }">
              Upload Data
            </span>
            <div 
              v-if="feedbackStore.isLoading" 
              class="absolute inset-0 flex items-center justify-center"
            >
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <div v-if="uploadError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
        {{ uploadError }}
      </div>

      <!-- Responsive filters section -->
      <div class="flex flex-col md:flex-row md:items-end gap-4">
        <!-- Período filter -->
        <div class="flex-1 min-w-[180px]">
          <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
          <select
            v-model="selectedPeriod"
            class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option
              v-for="period in periods"
              :key="period.value"
              :value="period.value"
            >
              {{ period.label }}
            </option>
          </select>
        </div>

        <!-- Funções filter -->
        <div class="flex-1 min-w-[180px] dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">Funções</label>
          <div 
            @click="toggleRoles"
            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center"
          >
            <span class="text-gray-700">{{ selectedRoles.length ? `${selectedRoles.length} selecionados` : 'Selecionar cargo' }}</span>
            <svg class="w-5 h-5 text-gray-400" :class="{ 'transform rotate-180': isRolesOpen }" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <div v-if="isRolesOpen" class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div class="p-2">
              <div class="space-y-1">
                <div
                  @click="toggleAllRoles"
                  class="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded border-b border-gray-200 mb-1"
                >
                  <input
                    type="checkbox"
                    :checked="allRolesSelected"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-gray-700 font-medium">Selecionar todos</span>
                </div>
                <div
                  v-for="role in ['agent', 'manager', 'supervisor']"
                  :key="role"
                  @click="handleRoleToggle(role)"
                  class="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="selectedRoles.includes(role)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-gray-700 capitalize">{{ role }}</span>
                  <span class="ml-auto text-gray-500">{{ roleCounts[role] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notas filter -->
        <div class="flex-1 min-w-[180px] dropdown-container relative">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notas</label>
          <div 
            @click="toggleScores"
            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center"
          >
            <span class="text-gray-700">{{ selectedScores.length ? `${selectedScores.length} selecionados` : 'Selecionar nota' }}</span>
            <svg class="w-5 h-5 text-gray-400" :class="{ 'transform rotate-180': isScoresOpen }" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </div>
          
          <div v-if="isScoresOpen" class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div class="p-2">
              <div class="space-y-1">
                <div
                  @click="toggleAllScores"
                  class="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded border-b border-gray-200 mb-1"
                >
                  <input
                    type="checkbox"
                    :checked="allScoresSelected"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-gray-700 font-medium">Selecionar todos</span>
                </div>
                <div
                  v-for="score in [1,2,3,4,5,6,7,8,9,10]"
                  :key="score"
                  @click="handleScoreToggle(score)"
                  class="flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="selectedScores.includes(score)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-gray-700">{{ score }}</span>
                  <span class="ml-auto text-gray-500">{{ scoreCounts[score] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 mt-4 md:mt-0">
          <button
            v-if="hasActiveFilters"
            @click="resetFilters"
            class="btn btn-secondary h-[42px] min-w-[100px]"
          >
            Limpar filtros
          </button>
          <button
            @click="handleSearch"
            class="btn btn-secondary h-[42px] min-w-[100px]"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-container {
  position: relative;
}
</style>