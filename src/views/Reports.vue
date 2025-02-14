<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFeedbackStore } from '../stores/feedback'

const feedbackStore = useFeedbackStore()
const isTableExpanded = ref(false)
const isTableMounted = ref(false)

const tableData = computed(() => 
  isTableMounted.value ? feedbackStore.filteredData : []
)

const getNPSZone = (score: number) => {
  if (score >= 75) return { zone: 'Excelência', color: 'bg-emerald-100 text-emerald-800', textColor: 'text-emerald-800' }
  if (score >= 50) return { zone: 'Qualidade', color: 'bg-green-100 text-green-800', textColor: 'text-green-800' }
  if (score >= 0) return { zone: 'Melhoria', color: 'bg-yellow-100 text-yellow-800', textColor: 'text-yellow-800' }
  return { zone: 'Crítica', color: 'bg-red-100 text-red-800', textColor: 'text-red-800' }
}

const toggleTable = () => {
  isTableExpanded.value = !isTableExpanded.value
  if (isTableExpanded.value && !isTableMounted.value) {
    isTableMounted.value = true
  }
}
</script>

<template>
  <div class="flex-1 bg-[#F9FAFC] space-y-6">
    <div class="bg-white rounded-[10px] border border-[#E1E9F4] shadow-[0_12px_24px_0_rgba(23,18,63,0.03)]">
      <div 
        @click="toggleTable"
        class="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
      >
        <h3 class="text-lg font-medium">Detalhes do NPS</h3>
        <svg 
          class="w-6 h-6 text-gray-500 transition-transform duration-200"
          :class="{ 'transform rotate-180': isTableExpanded }"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      <div v-show="isTableExpanded" class="border-t border-[#E1E9F4]">
        <div v-if="isTableMounted" class="p-6 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentário</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, index) in tableData" :key="index">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.user_id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getNPSZone(item.score).textColor">{{ item.score }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span :class="[getNPSZone(item.score).color, 'text-xs font-medium px-2.5 py-0.5 rounded-full']">
                    {{ getNPSZone(item.score).zone }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ item.reason }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.created_at }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.company_id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.role }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>