import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { InviteForm } from './invite-form'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('invites')
    .select('email, used_at')
    .eq('token', token)
    .single()

  if (!invite || invite.used_at) notFound()

  return <InviteForm email={invite.email} token={token} />
}
