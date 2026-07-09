import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth/reset-password - Reset password with token
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the reset token with explicit typing
    const result = await supabase
      .from('password_reset_tokens')
      .select('*, user:users(user_id, email)')
      .eq('token', token)
      .single()

    const resetToken = result.data as { id: number; user_id: number; expires_at: string; used_at: string | null; user: { user_id: number; email: string } } | null

    if (result.error || !resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (resetToken.used_at) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 })
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 })
    }

    // Get the auth_id for the user
    const { data: user } = await supabase
      .from('users')
      .select('auth_id')
      .eq('user_id', resetToken.user_id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the password in Supabase Auth
    // Use the auth.updateUser method instead of admin
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authError) {
      console.error('Auth password update error:', authError)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() } as never)
      .eq('id', resetToken.id)

    return NextResponse.json({ message: 'Password has been reset successfully. You can now sign in.' })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}