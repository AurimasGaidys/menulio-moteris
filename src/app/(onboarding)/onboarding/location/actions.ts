'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  location: z.string().min(1, 'Įveskite savo vietovę'),
})

export async function saveLocation(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ location: formData.get('location') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { error } = await supabase
    .from('users')
    .update({ location: parsed.data.location })
    .eq('id', user.id)
  if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }

  redirect('/onboarding/topics')
}
