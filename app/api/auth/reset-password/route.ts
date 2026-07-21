import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/auth/reset-password - Reset password with token
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json().catch(() => ({})) as { token?: string; newPassword?: string }

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const admin = await createAdminClient()

    // Find the reset token (admin client bypasses RLS)
    const result = await admin
      .from('password_reset_tokens')
      .select('*, user:users(user_id, auth_id)')
      .eq('token', token)
      .single()

    const resetToken = result.data as { id: number; user_id: number; expires_at: string; used_at: string | null; user: { user_id: number; auth_id: string } } | null

    if (result.error || !resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (resetToken.used_at) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 })
    }

    if (!resetToken.user?.auth_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use admin client to update password (no session needed)
    const { error: authError } = await admin.auth.admin.updateUserById(
      resetToken.user.auth_id,
      { password: newPassword }
    )

    if (authError) {
      console.error('[reset-password] Auth update error:', authError.message)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Mark token as used
    await admin
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() } as never)
      .eq('id', resetToken.id)

    return NextResponse.json({ message: 'Password has been reset successfully. You can now sign in.' })

  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
