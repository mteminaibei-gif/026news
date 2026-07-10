import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

// Type for validation result
interface ValidationError {
  field: string
  message: string
}

// Comprehensive validation function
function validateSignupInput(input: {
  email?: string
  password?: string
  name?: string
  role?: string
  bio?: string
  organization?: string
  portfolio?: string
  phone?: string
}): ValidationError[] {
  const errors: ValidationError[] = []

  // Email validation
  if (!input.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Password validation
  if (!input.password) {
    errors.push({ field: 'password', message: 'Password is required' })
  } else if (input.password.length < PASSWORD_MIN_LENGTH) {
    errors.push({ 
      field: 'password', 
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` 
    })
  } else if (!PASSWORD_REGEX.test(input.password)) {
    errors.push({ 
      field: 'password', 
      message: 'Password must contain uppercase, lowercase, and numbers' 
    })
  }

  // Name validation
  if (!input.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (input.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' })
  }

  // Role validation
  if (!input.role || !['journalist', 'reader', 'admin'].includes(input.role)) {
    errors.push({ field: 'role', message: 'Invalid role selected' })
  }

  // Journalist-specific validation
  if (input.role === 'journalist') {
    if (!input.organization?.trim()) {
      errors.push({ field: 'organization', message: 'Organization is required for journalists' })
    }
    if (!input.portfolio?.trim()) {
      errors.push({ field: 'portfolio', message: 'Portfolio URL is required for journalists' })
    }
    // Basic URL validation
    if (input.portfolio?.trim() && !isValidUrl(input.portfolio.trim())) {
      errors.push({ field: 'portfolio', message: 'Please enter a valid URL' })
    }
  }

  // Optional phone validation if provided
  if (input.phone?.trim() && !isValidPhone(input.phone.trim())) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' })
  }

  return errors
}

// Helper: Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`)
    return true
  } catch {
    return false
  }
}

// Helper: Validate phone format (basic international)
function isValidPhone(phone: string): boolean {
  return /^[\d\s\-\+\(\)]{8,}$/.test(phone)
}

// POST /api/auth/signup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      password,
      name,
      role = 'reader',
      bio = '',
      organization = '',
      portfolio = '',
      phone = '',
    } = body

    // Validate all inputs
    const validationErrors = validateSignupInput({
      email,
      password,
      name,
      role,
      bio,
      organization,
      portfolio,
      phone,
    })

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Email already registered',
          errors: [{ field: 'email', message: 'This email is already in use' }],
        },
        { status: 400 }
      )
    }

    const redirectTo = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
      : undefined

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })

    if (authError) {
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          errors: [{ field: 'auth', message: authError.message }],
        },
        { status: 400 }
      )
    }

    if (!authData.user?.id) {
      throw new Error('No user ID returned from signup')
    }

    // 2. Insert profile row
    const profilePayload: Record<string, any> = {
      auth_id: authData.user.id,
      name: name.trim(),
      email: email.toLowerCase(),
      role: role,
      bio: bio.trim() || null,
      status: 'active',
      social_links: role === 'journalist' ? {
        organization: organization.trim() || null,
        portfolio: portfolio.trim() || null,
        phone: phone.trim() || null,
      } : null,
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert([profilePayload] as any)

    if (profileError) {
      // Attempt to rollback auth user if profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (rollbackError) {
        console.error('[Rollback] Failed to delete auth user:', rollbackError)
      }

      return NextResponse.json(
        { 
          error: 'Profile creation failed',
          errors: [{ field: 'profile', message: profileError.message }],
        },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Check your email to confirm before signing in.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name.trim(),
          role: role,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/auth/signup] Error:', err)
    return NextResponse.json(
      { 
        error: 'Signup failed due to server error',
        errors: [{ field: 'server', message: 'Please try again later' }],
      },
      { status: 500 }
    )
  }
}