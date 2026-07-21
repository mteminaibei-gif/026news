import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { sendEmail } from '@/lib/gmail/server'

// GET /api/admin/journalists — list journalist applications (pending + all)
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') // 'pending', 'approved', 'declined', or null for all

    const admin = await createAdminClient()
    let query = admin
      .from('users')
      .select('user_id, name, email, role, status, profile_image, author_application, created_at')
      .in('role', ['journalist', 'reader'])

    if (status) {
      query = query.eq('author_application->>status', status)
    }

    const { data, error: queryError } = await query.order('created_at', { ascending: false })
    if (queryError) throw queryError

    return NextResponse.json({ applications: data ?? [] })
  } catch (err) {
    console.error('[GET /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

// POST /api/admin/journalists — approve or decline a journalist application
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, action, reason } = await req.json()
    if (!user_id || !['approve', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'user_id and action (approve/decline) are required' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Fetch current application with email
    const { data: user, error: fetchError } = await admin
      .from('users')
      .select('user_id, role, status, email, name, author_application')
      .eq('user_id', Number(user_id))
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const typedUser = user as { email: string; name: string | null; author_application: any }
    const app = typedUser.author_application
    if (!app || app.status !== 'pending') {
      return NextResponse.json({ error: 'No pending application found for this user' }, { status: 400 })
    }

    const applicantEmail = typedUser.email
    const applicantName = typedUser.name || 'Applicant'

    if (action === 'approve') {
      // Upgrade role to journalist, activate account, update application status
      const { error: updateError } = await admin
        .from('users')
        .update({
          role: 'journalist',
          status: 'active',
          author_application: { ...app, status: 'approved', reviewed_at: new Date().toISOString() },
        } as never)
        .eq('user_id', Number(user_id))

      if (updateError) throw updateError

      // Notify the applicant (in-app)
      await admin.from('notifications').insert({
        user_id: Number(user_id),
        type: 'journalist_application',
        title: 'Journalist application approved',
        message: 'Congratulations! Your application to write for 026connet! has been approved. You can now publish articles.',
      } as never)

      // Send email notification
      try {
        await sendEmail({
          to: applicantEmail,
          subject: 'Your 026connet! journalist application has been approved',
          html: `
            <p>Hi ${applicantName},</p>
            <p>Congratulations! Your application to write for <strong>026connet!</strong> has been <strong>approved</strong>.</p>
            <p>You can now log in and start publishing articles. Your account has been upgraded to <strong>Journalist</strong> status.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://026news.vercel.app'}/journalist" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Go to your journalist studio</a></p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e4e9e7" />
            <p style="font-size:12px;color:#6b776f;">If you have any questions, reply to this email or contact our editorial team.</p>
          `,
        })
      } catch (emailErr) {
        console.error('[journalist approve] email send failed:', emailErr)
        // Don't fail the approval if email fails
      }

      return NextResponse.json({ success: true, action: 'approved' })
    } else {
      // Decline — keep role but mark application as declined
      const { error: updateError } = await admin
        .from('users')
        .update({
          author_application: {
            ...app,
            status: 'declined',
            reason: reason || '',
            reviewed_at: new Date().toISOString(),
          },
        } as never)
        .eq('user_id', Number(user_id))

      if (updateError) throw updateError

      // Notify the applicant (in-app)
      await admin.from('notifications').insert({
        user_id: Number(user_id),
        type: 'journalist_application',
        title: 'Journalist application update',
        message: reason
          ? `Your journalist application was not approved. Reason: ${reason}`
          : 'Your journalist application was not approved at this time. Feel free to apply again later.',
      } as never)

      // Send email notification
      try {
        await sendEmail({
          to: applicantEmail,
          subject: 'Update on your 026connet! journalist application',
          html: `
            <p>Hi ${applicantName},</p>
            <p>Thank you for applying to write for <strong>026connet!</strong>. After careful review, we&apos;re unable to approve your application at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>You&apos;re welcome to apply again in the future as our editorial needs evolve.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://026news.vercel.app'}/author-apply" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Apply again</a></p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e4e9e7" />
            <p style="font-size:12px;color:#6b776f;">If you have any questions, reply to this email or contact our editorial team.</p>
          `,
        })
      } catch (emailErr) {
        console.error('[journalist decline] email send failed:', emailErr)
        // Don't fail the decline if email fails
      }

      return NextResponse.json({ success: true, action: 'declined' })
    }
  } catch (err) {
    console.error('[POST /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 })
  }
}

// PATCH /api/admin/journalists — update journalist account status (suspend/reactivate)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentAdmin()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, status } = await req.json()
    const VALID_STATUSES = ['active', 'inactive', 'banned']
    if (!user_id || !status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'user_id and valid status (active/inactive/banned) are required' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error: updateError } = await admin
      .from('users')
      .update({ status } as never)
      .eq('user_id', Number(user_id))
    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PATCH /api/admin/journalists]', err)
    return NextResponse.json({ error: 'Failed to update journalist' }, { status: 500 })
  }
}
