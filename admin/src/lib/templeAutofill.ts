import api from './api'

export interface TempleAIAutofillRequest {
  templeName: string
  city?: string
  additionalContext?: string
  forceComplete?: boolean
}

export interface TempleAIAutofillResponse {
  draft: Record<string, unknown>
  confidenceNote?: string
  usedSources?: string[]
  prefillReport?: {
    totalFields: number
    filledFields: number
    missingFields: string[]
    pass2Attempted: boolean
    pass2FilledFields: number
  }
}

const unwrap = <T>(response: any): T => {
  if (response?.data?.data) {
    return response.data.data as T
  }
  if (response?.data) {
    return response.data as T
  }
  return response as T
}

export const templeAutofillService = {
  async generate(payload: TempleAIAutofillRequest): Promise<TempleAIAutofillResponse> {
    const response = await api.post('/v1/temples/ai/autofill', payload)
    return unwrap<TempleAIAutofillResponse>(response)
  },
}

export default templeAutofillService
