import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { subDays, parseISO, isAfter, isBefore, isEqual } from 'date-fns'

export interface FeedbackData {
  user_id: string;
  score: number;
  reason: string;
  created_at: string;
  company_id: string;
  role: string;
}

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbackData = ref<FeedbackData[]>([])
  const isLoading = ref(false)
  const filteredData = ref<FeedbackData[]>([]) // Initialize as empty array

  const addFeedbackData = (data: FeedbackData[]) => {
    feedbackData.value = data
    filteredData.value = [] // Initialize as empty array
  }

  const totalResponses = computed(() => feedbackData.value.length)
  
  const npsScore = computed(() => {
    if (feedbackData.value.length === 0) return 0
    
    const promoters = feedbackData.value.filter(f => f.score >= 9).length
    const detractors = feedbackData.value.filter(f => f.score <= 6).length
    const total = feedbackData.value.length
    
    return Math.round(((promoters - detractors) / total) * 100)
  })

  const filterFeedback = (period: string, roles: string[], scores: number[]) => {
    let filtered = [...feedbackData.value]
    const now = new Date()

    // Filtrar por período
    if (period !== 'all') {
      filtered = filtered.filter(item => {
        const date = parseISO(item.created_at)
        switch (period) {
          case 'today':
            return isEqual(date, now)
          case 'week':
            return isAfter(date, subDays(now, 7))
          case 'month':
            return isAfter(date, subDays(now, 30))
          case 'quarter':
            return isAfter(date, subDays(now, 90))
          case 'year':
            return isAfter(date, subDays(now, 365))
          default:
            return true
        }
      })
    }

    // Filtrar por função
    if (roles.length > 0) {
      filtered = filtered.filter(item => roles.includes(item.role))
    }

    // Filtrar por nota
    if (scores.length > 0) {
      filtered = filtered.filter(item => scores.includes(item.score))
    }

    filteredData.value = filtered
  }

  return {
    feedbackData,
    filteredData,
    isLoading,
    addFeedbackData,
    filterFeedback,
    totalResponses,
    npsScore
  }
})