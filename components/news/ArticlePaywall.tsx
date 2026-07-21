import Link from 'next/link'
import { Lock, ArrowRight, MessageSquare, Users } from 'lucide-react'

/**
 * Shown to anonymous visitors after the article intro.
 * Encourages sign-in / sign-up (with a redirect back to the article)
 * so the full story, comments and reactions stay members-only.
 */
export function ArticlePaywall({ slug, redirectTo }: { slug: string; redirectTo: string }) {
  const loginHref = `/login?redirect=${encodeURIComponent(redirectTo)}`
  const signupHref = `/signup?redirect=${encodeURIComponent(redirectTo)}`

  return (
    <div className="article-paywall">
      <div className="article-paywall-glow" aria-hidden />
      <div className="article-paywall-lock">
        <Lock size={22} />
      </div>
      <h3 className="article-paywall-title">Continue reading with 026connet!</h3>
      <p className="article-paywall-text">
        This story is free for members. Sign in to read the full article, join the
        conversation, react in real time and follow the journalists behind the news.
      </p>

      <div className="article-paywall-actions">
        <Link href={signupHref} className="article-paywall-btn primary">
          Create free account <ArrowRight size={16} />
        </Link>
        <Link href={loginHref} className="article-paywall-btn ghost">
          Sign in
        </Link>
      </div>

      <div className="article-paywall-perks">
        <span><MessageSquare size={14} /> Comment &amp; debate</span>
        <span><Users size={14} /> Follow journalists</span>
      </div>
    </div>
  )
}
