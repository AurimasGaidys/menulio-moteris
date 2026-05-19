'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  level: z.coerce.number().int().min(1).max(5),
})

export async function saveLevel(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ level: formData.get('level') })
  if (!parsed.success) return { error: 'Pasirinkite lygį nuo 1 iki 5' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ level: parsed.data.level })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/photo')
}
