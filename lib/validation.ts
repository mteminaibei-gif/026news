import { z } from 'zod'

/**
 * Article validation schemas
 */
export const createArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300, 'Title must be less than 300 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(100000, 'Content must be less than 100,000 characters'),
  excerpt: z.string().max(500, 'Excerpt must be less than 500 characters').optional(),
  category_id: z.number().int().positive('Invalid category').optional().nullable(),
  category_name: z.string().optional(), // For backward compatibility
  tags: z.string().max(500, 'Tags too long').optional(),
  featured_image: z.string().url('Invalid image URL').optional(),
  monetization_type: z.enum(['free', 'sponsored', 'ad', 'paywall'], {
    errorMap: () => ({ message: 'Invalid monetization type' }),
  }),
  source_reference: z.string().url('Invalid source URL').optional(),
  action: z.enum(['draft', 'submit'], {
    errorMap: () => ({ message: 'Action must be draft or submit' }),
  }),
})

export const editArticleSchema = createArticleSchema.partial().extend({
  article_id: z.number().int().positive('Invalid article ID'),
})

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Password must contain uppercase letter').regex(/[0-9]/, 'Password must contain number'),
})

export const adminSignupSchema = signupSchema.extend({
  invite_code: z.string().min(1, 'Invite code required'),
})

export const applyJournalistSchema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(1000, 'Bio must be less than 1000 characters'),
  portfolio_url: z.string().url('Invalid portfolio URL').optional(),
  experience_years: z.number().int().min(0).max(70),
  writing_samples: z.array(z.string().url('Invalid URL')).min(1, 'At least one writing sample required'),
})

/**
 * Comment validation
 */
export const commentSchema = z.object({
  article_id: z.number().int().positive('Invalid article ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment too long'),
})

/**
 * User profile validation
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name too short').max(100, 'Name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  profile_image: z.string().url('Invalid image URL').optional(),
  social_links: z.object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
})

/**
 * Payment validation schemas
 */
export const mpesaPaymentSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^254\d{9}$/, 'Phone number must be Kenyan format: 254XXXXXXXXX'),
  amount: z
    .number()
    .min(10, 'Minimum amount is 10 KES')
    .max(500000, 'Maximum amount is 500,000 KES'),
  orderId: z.string().uuid('Invalid order ID'),
  description: z.string().min(1, 'Description required').max(200, 'Description too long'),
})

export const stripeCheckoutSchema = z.object({
  plan: z.enum(['premium', 'pro'], {
    errorMap: () => ({ message: 'Invalid subscription plan' }),
  }),
})

export const paypalPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Minimum amount is 0.01 USD').max(100000, 'Maximum amount is 100,000 USD'),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  orderId: z.string().uuid('Invalid order ID'),
})

/**
 * Category validation
 */
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name too short').max(50, 'Category name too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(2, 'Icon must be single emoji or character').optional(),
})

/**
 * Search and filtering validation
 */
export const articlesFilterSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['draft', 'under_review', 'published', 'rejected']).optional(),
  author_id: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(['recent', 'popular', 'trending']).default('recent'),
  search: z.string().max(200, 'Search query too long').optional(),
})

/**
 * Admin actions
 */
export const bulkArticleActionSchema = z.object({
  article_ids: z.array(z.number().int().positive()).min(1, 'At least one article required'),
  action: z.enum(['publish', 'reject', 'feature', 'archive', 'delete']),
  reason: z.string().max(500, 'Reason too long').optional(),
})

export const bulkCommentActionSchema = z.object({
  comment_ids: z.array(z.string().uuid()).min(1, 'At least one comment required'),
  action: z.enum(['hide', 'flag', 'approve', 'delete']),
  reason: z.string().max(500, 'Reason too long').optional(),
})

/**
 * Notification preferences
 */
export const notificationPrefsSchema = z.object({
  email_digests: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
  sms_alerts: z.boolean().default(false),
  newsletter: z.boolean().default(true),
  marketing: z.boolean().default(false),
})

/**
 * Helper function to validate and return typed data
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Helper for API error responses
 */
export function formatValidationError(error: z.ZodError) {
  return {
    error: 'Validation failed',
    issues: error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  }
}
