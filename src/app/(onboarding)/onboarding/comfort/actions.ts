'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  comfort_level: z.coerce.number().int().min(1).max(5),
})

export async function saveComfort(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ comfort_level: formData.get('comfort_level') })
  if (!parsed.success) return { error: 'Pasirinkite lygį nuo 1 iki 5' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ comfort_level: parsed.data.comfort_level })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/waiting')
}
