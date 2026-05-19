'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const TIMES = ['morning', 'afternoon', 'evening']

export async function saveAvailability(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const availability: Record<string, string[]> = {}
  for (const day of DAYS) {
    const slots = TIMES.filter((t) => formData.get(`${day}_${t}`) === '1')
    if (slots.length) availability[day] = slots
  }

  if (!Object.keys(availability).length) return { error: 'Pasirinkite bent vieną laiką' }
  const parsed = z.record(z.string(), z.array(z.string())).safeParse(availability)
  if (!parsed.success) return { error: 'Pasirinkite bent vieną laiką' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ availability: parsed.data })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/comfort')
}
