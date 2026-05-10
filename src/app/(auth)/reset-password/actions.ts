'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z
  .object({
    password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

export async function updatePassword(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: 'Nepavyko atnaujinti slaptažodžio. Bandykite dar kartą.' }
  redirect('/dashboard')
}
