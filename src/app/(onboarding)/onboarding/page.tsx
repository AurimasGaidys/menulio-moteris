import { redirect } from 'next/navigation'
import { getOnboardingData } from '@/lib/onboarding'

export default async function OnboardingPage() {
  const { dbUser, profile } = await getOnboardingData()

  if (!dbUser) redirect('/onboarding/name')
  if (dbUser.membership_status !== 'pending') redirect('/dashboard')
  if (!dbUser.location) redirect('/onboarding/location')
  if (!profile || !profile.topics.length) redirect('/onboarding/topics')
  if (!profile.level) redirect('/onboarding/level')
  if (!dbUser.avatar_url) redirect('/onboarding/photo')
  if (!Object.keys(profile.availability).length) redirect('/onboarding/availability')
  if (!profile.comfort_level) redirect('/onboarding/comfort')

  redirect('/onboarding/waiting')
}
