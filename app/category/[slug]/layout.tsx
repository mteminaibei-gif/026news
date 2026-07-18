import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: cat } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!cat) return { title: 'Category — 026connet!' }

  const name = (cat as { name: string; description: string | null }).name
  const desc = (cat as { name: string; description: string | null }).description || `Latest ${name} news, analysis, and updates.`

  return {
    title: `${name} — 026connet!`,
    description: desc,
    openGraph: {
      title: `${name} — 026connet!`,
      description: desc,
      siteName: '026connet!',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — 026connet!`,
      description: desc,
    },
  }
}

export default function CategoryLayout({ children }: Props) {
  return <>{children}</>
}
