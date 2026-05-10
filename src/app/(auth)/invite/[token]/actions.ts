'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

export async function createAccountFromInvite(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = schema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { token, password } = parsed.data
  const admin = createAdminClient()

  // Fetch invite from DB — email comes from trusted source, not form input
  const { data: invite } = await admin
    .from('invites')
    .select('id, email')
    .eq('token', token)
    .is('used_at', null)
    .single()

  if (!invite) return { error: 'Kvietimas nebegalioja.' }

  const email = invite.email

  // Create user via admin API — auto-confirms email
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) return { error: 'Nepavyko sukurti paskyros.' }

  // Create public.users row (name will be set during onboarding)
  await admin.from('users').insert({
    id: created.user.id,
    name: email.split('@')[0],
    membership_status: 'pending',
    role: 'member',
  })

  // Mark invite as used
  await admin
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  // Sign user in with regular client
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) return { error: 'Paskyra sukurta. Prisijunkite rankiniu būdu.' }

  redirect('/onboarding')
}
