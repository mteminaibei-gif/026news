import { createAdminClient } from '@/lib/supabase/server'

export type JobType = 'rss_fetch' | 'notification' | 'payout' | 'email' | 'sms'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface QueuedJob {
  id: string
  type: JobType
  data: Record<string, any>
  status: JobStatus
  attempts: number
  maxAttempts: number
  nextRetry: Date
  error?: string
  createdAt: Date
  completedAt?: Date
}

/**
 * Enqueue a job with automatic retry on failure
 */
export async function enqueueJob(
  type: JobType,
  data: Record<string, any>,
  maxAttempts: number = 3
) {
  try {
    const supabase = await createAdminClient()

    const result = await supabase.from('job_queue').insert({
      type,
      data,
      status: 'pending',
      attempts: 0,
      max_attempts: maxAttempts,
      next_retry: new Date(),
    } as any)

    if (result.error) throw result.error
    return result.data
  } catch (error) {
    console.error('Failed to enqueue job:', error)
    throw error
  }
}

/**
 * Calculate exponential backoff delay
 * Base: 60 seconds, multiplier: 2x per attempt
 */
function calculateBackoff(attempt: number): number {
  const baseDelaySeconds = 60
  const maxDelaySeconds = 3600 // 1 hour max
  const delay = baseDelaySeconds * Math.pow(2, attempt - 1)
  return Math.min(delay, maxDelaySeconds)
}

/**
 * Process jobs from queue
 * This should be called by a cron job or scheduled trigger
 */
export async function processQueue() {
  try {
    const supabase = await createAdminClient()

    // Get due jobs (pending or failed, and next_retry has passed)
    const { data: jobs, error } = await supabase
      .from('job_queue')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('next_retry', new Date().toISOString())
      .limit(10)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching jobs:', error)
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    for (const job of jobs || []) {
      try {
        // Mark as processing
        await supabase
          .from('job_queue')
          .update({ status: 'processing' } as any)
          .eq('id', job.id)

        // Process based on type
        let success = false
        try {
          switch (job.type) {
            case 'rss_fetch':
              await processFeedFetch(job.data)
              success = true
              break
            case 'notification':
              await sendNotification(job.data)
              success = true
              break
            case 'payout':
              await processPayout(job.data)
              success = true
              break
            case 'email':
              await sendEmail(job.data)
              success = true
              break
            case 'sms':
              await sendSMS(job.data)
              success = true
              break
            default:
              console.warn(`Unknown job type: ${job.type}`)
              success = false
          }
        } catch (processError) {
          console.error(`Error processing ${job.type} job:`, processError)
          success = false
        }

        if (success) {
          // Mark complete
          await supabase
            .from('job_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            } as any)
            .eq('id', job.id)

          processed++
        } else {
          // Handle failure with retry
          const nextAttempt = job.attempts + 1
          const willRetry = nextAttempt < job.max_attempts

          const backoffSeconds = calculateBackoff(nextAttempt)
          const nextRetryTime = new Date(Date.now() + backoffSeconds * 1000)

          await supabase
            .from('job_queue')
            .update({
              status: willRetry ? 'pending' : 'failed',
              attempts: nextAttempt,
              next_retry: nextRetryTime.toISOString(),
              error: `Attempt ${nextAttempt} failed. Next retry in ${backoffSeconds}s`,
            } as any)
            .eq('id', job.id)

          // Alert admin on final failure
          if (!willRetry) {
            await alertAdminJobFailure(job, nextAttempt)
            failed++
          }
        }
      } catch (error) {
        console.error(`Error updating job status for ${job.id}:`, error)
        failed++
      }
    }

    return { processed, failed, total: jobs?.length || 0 }
  } catch (error) {
    console.error('Queue processing failed:', error)
    return { processed: 0, failed: 0, error: String(error) }
  }
}

/**
 * Alert admin about failed job
 */
async function alertAdminJobFailure(job: any, attempts: number) {
  try {
    const supabase = await createAdminClient()

    // Send notification to admin
    await supabase.from('notifications').insert({
      user_id: 1, // Assuming admin user_id is 1
      type: 'job_failed',
      message: `Job ${job.type} #${job.id} failed after ${attempts} attempts`,
      data: {
        jobId: job.id,
        jobType: job.type,
        attempts,
        error: job.error,
      },
    })

    // Optional: Send email to admin
    console.error(`ADMIN ALERT: Job ${job.type} #${job.id} failed after ${attempts} attempts`, job.error)
  } catch (error) {
    console.error('Failed to alert admin:', error)
  }
}

/**
 * Job processors
 */

async function processFeedFetch(data: Record<string, any>) {
  // Implementation would fetch RSS feeds
  console.log('Processing RSS feed fetch:', data)
  // This would call the actual RSS fetching logic
}

async function sendNotification(data: Record<string, any>) {
  console.log('Sending notification:', data)
  // Send push notification via web-push library
}

async function processPayout(data: Record<string, any>) {
  console.log('Processing payout:', data)
  // Call payment processor (M-Pesa, Stripe, PayPal)
}

async function sendEmail(data: Record<string, any>) {
  console.log('Sending email:', data)
  // Send email via Sendgrid, Mailgun, etc.
}

async function sendSMS(data: Record<string, any>) {
  console.log('Sending SMS:', data)
  // Send SMS via Twilio
}

/**
 * Manually enqueue common tasks
 */

export async function scheduleEmailNotification(userId: number, subject: string, message: string) {
  return enqueueJob('email', { userId, subject, message })
}

export async function schedulePayoutProcessing(userId: number, amount: number, method: string) {
  return enqueueJob('payout', { userId, amount, method }, 5) // More retries for payments
}

export async function scheduleRSSFetch(sourceId: number) {
  return enqueueJob('rss_fetch', { sourceId }, 3)
}

/**
 * Migration: Create job_queue table
 * Run this in Supabase SQL Editor
 */
export const JOB_QUEUE_SQL = `
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  next_retry TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_type CHECK (type IN ('rss_fetch', 'notification', 'payout', 'email', 'sms'))
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON public.job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_next_retry ON public.job_queue(next_retry);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON public.job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_created ON public.job_queue(created_at);

-- Grant access to service role
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role to manage jobs" ON public.job_queue
  USING (true) WITH CHECK (true);
`
