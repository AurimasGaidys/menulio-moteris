'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveAvailability } from './actions'

const DAYS = [
  { key: 'mon', label: 'Pr' },
  { key: 'tue', label: 'An' },
  { key: 'wed', label: 'Tr' },
  { key: 'thu', label: 'Ke' },
  { key: 'fri', label: 'Pe' },
  { key: 'sat', label: 'Še' },
  { key: 'sun', label: 'Se' },
]
const TIMES = [
  { key: 'morning', label: 'Rytas' },
  { key: 'afternoon', label: 'Popietė' },
  { key: 'evening', label: 'Vakaras' },
]

type Selected = Set<string>

function initSelected(availability: Record<string, string[]>): Selected {
  const s = new Set<string>()
  for (const [day, times] of Object.entries(availability)) {
    for (const t of times) s.add(`${day}_${t}`)
  }
  return s
}

export function AvailabilityForm({ initialAvailability }: { initialAvailability: Record<string, string[]> }) {
  const [state, formAction, isPending] = useActionState(saveAvailability, { error: null })
  const [selected, setSelected] = useState<Selected>(() => initSelected(initialAvailability))

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left font-normal text-muted-foreground pb-2 pr-2" />
              {DAYS.map((d) => (
                <th key={d.key} className="text-center font-normal text-muted-foreground pb-2 px-1 min-w-[2.5rem]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((t) => (
              <tr key={t.key}>
                <td className="text-muted-foreground pr-3 py-1 whitespace-nowrap">{t.label}</td>
                {DAYS.map((d) => {
                  const key = `${d.key}_${t.key}`
                  const active = selected.has(key)
                  return (
                    <td key={d.key} className="text-center py-1 px-1">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="w-8 h-8 rounded transition-colors border"
                        style={
                          active
                            ? { backgroundColor: 'var(--brand-green)', borderColor: 'var(--brand-green)' }
                            : { backgroundColor: 'white', borderColor: 'var(--border)' }
                        }
                        aria-label={`${d.label} ${t.label}`}
                        aria-pressed={active}
                      />
                      {active && <input type="hidden" name={key} value="1" />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        style={{ backgroundColor: 'var(--brand-green)' }}
        disabled={isPending}
      >
        {isPending ? 'Saugoma...' : 'Toliau →'}
      </Button>
    </form>
  )
}
