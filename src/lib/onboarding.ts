import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type OnboardingUser = {
  id: string
  name: string
  location: string | null
  avatar_url: string | null
}

export type OnboardingProfile = {
  topics: string[]
  level: number | null
  availability: Record<string, string[]>
  comfort_level: number | null
}

export async function getOnboardingData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, name, location, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('topics, level, availability, comfort_level')
    .eq('user_id', user.id)
    .single()

  return {
    user: { id: user.id, email: user.email },
    dbUser: dbUser as OnboardingUser | null,
    profile: profile as OnboardingProfile | null,
  }
}
