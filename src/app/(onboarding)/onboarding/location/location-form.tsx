'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveLocation } from './actions'

export function LocationForm({ initialLocation }: { initialLocation: string }) {
  const [state, formAction, isPending] = useActionState(saveLocation, { error: null })
  const [value, setValue] = useState(initialLocation)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (initialLocation || !navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=lt`
          )
          const data = await res.json()
          const city =
            data.address?.city ??
            data.address?.town ??
            data.address?.village ??
            data.address?.county ??
            ''
          if (city) setValue(city)
        } catch {
          // silent — user types manually
        } finally {
          setDetecting(false)
        }
      },
      () => setDetecting(false)
    )
  }, [initialLocation])

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="location">Miestas arba rajonas</Label>
        <Input
          id="location"
          name="location"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={detecting ? 'Nustatoma...' : 'pvz. Vilnius'}
          disabled={detecting}
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending || detecting}
      >
        {isPending ? 'Saugoma...' : 'Toliau →'}
      </Button>
    </form>
  )
}
