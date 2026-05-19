'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({
  name: z.string().min(2, 'Vardas turi būti bent 2 simboliai'),
})

export async function saveName(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    const admin = createAdminClient()
    const { error } = await admin.from('users').insert({
      id: user.id,
      name: parsed.data.name,
      membership_status: 'pending',
      role: 'member',
    })
    if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }
  } else {
    const { error } = await supabase
      .from('users')
      .update({ name: parsed.data.name })
      .eq('id', user.id)
    if (error) return { error: 'Nepavyko išsaugoti. Bandykite dar kartą.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (profileError) return { error: 'Nepavyko sukurti profilio. Bandykite dar kartą.' }

  redirect('/onboarding/location')
}
