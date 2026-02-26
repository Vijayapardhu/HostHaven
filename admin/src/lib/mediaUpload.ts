import api from './api'

export interface UploadedMediaAsset {
  url: string
  key?: string
  publicId?: string
  format?: string
  bytes?: number
}

interface UploadOptions {
  folder?: string
  resourceType?: 'image' | 'video' | 'raw' | string
  onProgress?: (progress: number) => void
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

export const mediaUploadService = {
  async uploadSingle(file: File, options: UploadOptions = {}): Promise<UploadedMediaAsset> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/v1/uploads/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        folder: options.folder || 'hosthaven',
        resourceType: options.resourceType || 'image',
      },
      onUploadProgress: (event) => {
        if (!options.onProgress || !event.total) return
        options.onProgress(Math.round((event.loaded * 100) / event.total))
      },
    })

    return unwrap<UploadedMediaAsset>(response)
  },

  async uploadMultiple(files: File[], options: UploadOptions = {}): Promise<UploadedMediaAsset[]> {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))

    const response = await api.post('/v1/uploads/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        folder: options.folder || 'hosthaven',
        resourceType: options.resourceType || 'image',
      },
      onUploadProgress: (event) => {
        if (!options.onProgress || !event.total) return
        options.onProgress(Math.round((event.loaded * 100) / event.total))
      },
    })

    return unwrap<UploadedMediaAsset[]>(response)
  },
}

export default mediaUploadService
