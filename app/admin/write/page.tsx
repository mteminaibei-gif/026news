import type { Metadata } from 'next'
import { AdminArticleEditor } from '@/components/admin/AdminArticleEditor'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Write Article — Admin Panel' }

export default async function AdminWritePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rawAdmin } = await supabase
    .from('users').select('name, profile_image').eq('email', user?.email ?? '').single()
  const admin = rawAdmin as { name: string; profile_image: string | null } | null

  return (
    <div className="flex-1">
      <AdminArticleEditor
        redirectTo="/admin/articles"
        adminName={admin?.name ?? 'Admin'}
        adminImage={admin?.profile_image ?? null}
      />
    </div>
  )
}
