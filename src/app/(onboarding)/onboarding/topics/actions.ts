'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  topics: z.array(z.string()).min(1, 'Pasirinkite bent vieną temą'),
})

export async function saveTopics(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ topics: formData.getAll('topics') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('profiles')
    .update({ topics: parsed.data.topics })
    .eq('user_id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/level')
}
