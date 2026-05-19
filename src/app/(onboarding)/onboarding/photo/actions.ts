'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function savePhoto(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const file = formData.get('photo') as File | null
  if (!file || file.size === 0) return { error: 'Pasirinkite nuotrauką' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Nuotrauka negali viršyti 5 MB' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nesate prisijungę' }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const path = `${user.id}/avatar.jpg`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
  if (uploadError) return { error: 'Nepavyko įkelti nuotraukos' }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: urlData.publicUrl })
    .eq('id', user.id)
  if (updateError) return { error: 'Nepavyko išsaugoti' }

  redirect('/onboarding/availability')
}
