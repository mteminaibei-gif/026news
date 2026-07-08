import { createClient } from '@/lib/supabase/client'

// ─── Storage bucket names ─────────────────────────────────────────────────────
export const BUCKETS = {
  FEATURED_IMAGES: 'article-images',
  PROFILE_IMAGES:  'avatars',
  ARTICLE_MEDIA:   'article-images',
} as const

type BucketName = typeof BUCKETS[keyof typeof BUCKETS]

// ─── Upload a file to a Supabase Storage bucket ───────────────────────────────
export async function uploadFile(
  bucket: BucketName,
  file: File,
  pathPrefix: string = ''
): Promise<{ url: string; path: string }> {
  const supabase = createClient()

  // Sanitize filename
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const name = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(name, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return { url: publicUrl, path: data.path }
}

// ─── Upload featured image for an article ─────────────────────────────────────
export async function uploadFeaturedImage(file: File, articleSlug: string) {
  return uploadFile(BUCKETS.FEATURED_IMAGES, file, `articles/${articleSlug}/`)
}

// ─── Upload journalist profile picture ────────────────────────────────────────
export async function uploadProfileImage(file: File, userId: number) {
  return uploadFile(BUCKETS.PROFILE_IMAGES, file, `users/${userId}/`)
}

// ─── Delete a file ────────────────────────────────────────────────────────────
export async function deleteFile(bucket: BucketName, path: string) {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

// ─── Get a signed (temporary) URL for private files ──────────────────────────
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

// ─── React hook for file upload with progress ────────────────────────────────
// Usage: const { upload, uploading, progress, error } = useFileUpload()
import { useState, useCallback } from 'react'

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState<string | null>(null)

  const upload = useCallback(async (
    bucket: BucketName,
    file: File,
    pathPrefix?: string
  ): Promise<{ url: string; path: string } | null> => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate progress (Supabase JS v2 doesn't expose upload progress)
      const interval = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 200)
      const result = await uploadFile(bucket, file, pathPrefix)
      clearInterval(interval)
      setProgress(100)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, progress, error }
}
