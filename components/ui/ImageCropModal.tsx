'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X } from 'lucide-react'

interface ImageCropModalProps {
  open: boolean
  imageSrc: string
  onClose: () => void
  onCropComplete: (blob: Blob) => void
  aspect?: number
  title?: string
}

function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }

      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height,
      )
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/jpeg', 0.92)
    }
    image.onerror = () => reject(new Error('Failed to load image'))
    image.src = imageSrc
  })
}

export function ImageCropModal({ open, imageSrc, onClose, onCropComplete, aspect = 1, title = 'Crop your photo' }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), [])
  const onZoomChange = useCallback((z: number) => setZoom(z), [])
  const onCropCompleteInternal = useCallback((_: any, pixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(blob)
      onClose()
    } catch {
      alert('Failed to crop image')
    } finally {
      setProcessing(false)
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 20,
          border: '1px solid var(--border)', width: '90vw', maxWidth: 460,
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface-2)', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Crop area */}
        <div style={{ position: 'relative', width: '100%', height: 340, background: '#1a1a2e' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            cropShape="round"
            showGrid={false}
            style={{ containerStyle: { borderRadius: 0 } }}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 20px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600,
              background: 'var(--surface-2)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700,
              background: 'var(--primary)', color: '#fff',
              border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
              opacity: processing || !croppedAreaPixels ? 0.6 : 1,
            }}
          >
            {processing ? 'Processing...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
