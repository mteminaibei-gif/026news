import type { Metadata } from 'next'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
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
    <>
      <Topbar
        title="Write New Article"
        user={{ name: admin?.name ?? 'Admin', profile_image: admin?.profile_image ?? null }}
      >
        <Link
          href="/admin/articles"
          className="text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          ← All Articles
        </Link>
      </Topbar>

      <div className="p-6 flex-1">
        <AdminArticleEditor redirectTo="/admin/articles" />
      </div>
    </>
  )
}
