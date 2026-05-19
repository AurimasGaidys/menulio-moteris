'use client'

import { useActionState, useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { savePhoto } from './actions'

function initCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 80 }, 1, w, h), w, h)
}

export function PhotoForm({ currentAvatarUrl }: { currentAvatarUrl: string | null }) {
  const [state, dispatch, isPending] = useActionState(savePhoto, { error: null })
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [clientError, setClientError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setClientError('Nuotrauka negali viršyti 5 MB'); return }
    setClientError(null)
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    setCrop(initCrop(w, h))
  }

  function handleSubmit() {
    if (!imgRef.current || !crop) return
    const canvas = document.createElement('canvas')
    const SIZE = 400
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    const img = imgRef.current
    const sx = (crop.x / 100) * img.naturalWidth
    const sy = (crop.y / 100) * img.naturalHeight
    const sw = (crop.width / 100) * img.naturalWidth
    const sh = (crop.height / 100) * img.naturalHeight
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE)
    canvas.toBlob((blob) => {
      if (!blob) return
      const fd = new FormData()
      fd.append('photo', blob, 'avatar.jpg')
      dispatch(fd)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="space-y-6">
      {currentAvatarUrl && !src && (
        <div className="flex justify-center">
          <img src={currentAvatarUrl} alt="Dabartinė nuotrauka" className="w-24 h-24 rounded-full object-cover" />
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm font-medium">{src ? 'Apkarpykite nuotrauką' : 'Pasirinkite nuotrauką'}</label>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-sm" />
      </div>
      {src && (
        <ReactCrop crop={crop} onChange={setCrop} aspect={1} circularCrop className="max-w-full">
          <img ref={imgRef} src={src} onLoad={onImageLoad} alt="Apkarpyti" className="max-w-full" />
        </ReactCrop>
      )}
      {(clientError ?? state.error) && (
        <p className="text-sm text-destructive">{clientError ?? state.error}</p>
      )}
      <Button
        type="button"
        onClick={handleSubmit}
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending || !src || !crop}
      >
        {isPending ? 'Įkeliama...' : 'Toliau →'}
      </Button>
    </div>
  )
}
