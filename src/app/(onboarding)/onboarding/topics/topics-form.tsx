'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveTopics } from './actions'

const ALL_TOPICS = [
  'Menstruacinis ciklas', 'Joga', 'Meditacija', 'Dvasingumas',
  'Žolelės ir natūrali medicina', 'Energetinės praktikos',
  'Moters sveikata', 'Kūno intuicija', 'Ritualai',
  'Motinystė', 'Savęs pažinimas', 'Gyvenimo ritmai',
]

export function TopicsForm({ initialTopics }: { initialTopics: string[] }) {
  const [state, formAction, isPending] = useActionState(saveTopics, { error: null })
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTopics))

  function toggle(topic: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(topic) ? next.delete(topic) : next.add(topic)
      return next
    })
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {ALL_TOPICS.map((topic) => {
          const active = selected.has(topic)
          return (
            <button
              key={topic}
              type="button"
              onClick={() => toggle(topic)}
              className="px-3 py-1.5 rounded-full text-sm border transition-colors"
              style={
                active
                  ? { backgroundColor: 'var(--brand-green)', color: 'white', borderColor: 'var(--brand-green)' }
                  : { backgroundColor: 'white', borderColor: 'var(--border)' }
              }
            >
              {topic}
            </button>
          )
        })}
      </div>
      {Array.from(selected).map((t) => (
        <input key={t} type="hidden" name="topics" value={t} />
      ))}
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
