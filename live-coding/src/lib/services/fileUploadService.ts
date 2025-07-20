/**
 * File Upload Service
 * 
 * Handles file uploads for assignments, course materials, and other content.
 * Integrates with Supabase Storage for secure file management.
 */

import { supabase } from '@/lib/database/supabase'

export interface UploadResult {
  url: string
  path: string
  size: number
  type: string
}

export interface UploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  folder?: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File, 
  path: string, 
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    folder = 'uploads'
  } = options

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`)
  }

  // Validate file type
  const isAllowedType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  if (!isAllowedType) {
    throw new Error(`File type ${file.type} is not allowed`)
  }

  // Generate unique file path
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2)
  const extension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}.${extension}`
  const fullPath = `${folder}/${path}/${fileName}`

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-content')
      .getPublicUrl(fullPath)

    return {
      url: urlData.publicUrl,
      path: fullPath,
      size: file.size,
      type: file.type,
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('course-content')
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error('File delete error:', error)
    throw error
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('course-content')
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop()
      })

    if (error) {
      throw new Error(`Failed to get file metadata: ${error.message}`)
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Get file metadata error:', error)
    throw error
  }
}

/**
 * Generate a signed URL for temporary access
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('course-content')
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  } catch (error) {
    console.error('Create signed URL error:', error)
    throw error
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  basePath: string,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    try {
      const result = await uploadFile(file, basePath, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      throw error
    }
  }
  
  return results
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: UploadOptions = {}): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/*', 'application/pdf', 'text/*']
  } = options

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
    }
  }

  const isAllowedType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  if (!isAllowedType) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  return { valid: true }
}