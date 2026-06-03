import api from './api'
import imageCompression from 'browser-image-compression'

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
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

const imageCompressionOptions = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
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

const compressImage = async (file: File, options: UploadOptions): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const compressionOptions = {
    ...imageCompressionOptions,
    maxSizeMB: options.maxSizeMB || imageCompressionOptions.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight || imageCompressionOptions.maxWidthOrHeight,
  }

  try {
    const compressedFile = await imageCompression(file, compressionOptions)
    console.log(`[Upload] Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
    return compressedFile
  } catch (error) {
    console.warn('[Upload] Compression failed, using original file:', error)
    return file
  }
}

export const mediaUploadService = {
  async uploadSingle(file: File, options: UploadOptions = {}): Promise<UploadedMediaAsset> {
    const compressedFile = await compressImage(file, options)
    
    const formData = new FormData()
    formData.append('file', compressedFile)

    const response = await api.post('/v1/uploads/single', formData, {
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
    const compressedFiles: File[] = []
    
    for (const file of files) {
      const compressed = await compressImage(file, options)
      compressedFiles.push(compressed)
    }
    
    const formData = new FormData()
    compressedFiles.forEach((file) => formData.append('files', file))

    try {
      const response = await api.post('/v1/uploads/multiple', formData, {
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
    } catch {
      const uploads: UploadedMediaAsset[] = []

      for (let index = 0; index < compressedFiles.length; index += 1) {
        const form = new FormData()
        form.append('file', compressedFiles[index])

        const response = await api.post('/v1/uploads/single', form, {
          params: {
            folder: options.folder || 'hosthaven',
            resourceType: options.resourceType || 'image',
          },
        })

        uploads.push(unwrap<UploadedMediaAsset>(response))

        if (options.onProgress) {
          options.onProgress(Math.round(((index + 1) * 100) / compressedFiles.length))
        }
      }

      return uploads
    }
  },
}

export default mediaUploadService
