-- ================================================================
-- 026news - Critical Fixes Migration
-- Adds job queue, M-Pesa transactions, and improves data integrity
-- ================================================================

-- ─────────────────────────────────────────────────────────────────
--  TABLE: job_queue
--  For reliable job processing with retry logic
-- ─────────────────────────────────────────────────────────────────

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

ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage jobs" ON public.job_queue
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
--  TABLE: mpesa_transactions
--  Tracks M-Pesa payment status and receipts
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_request_id TEXT NOT NULL UNIQUE,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT UNIQUE,
  order_id UUID NOT NULL,
  description TEXT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_mpesa_status CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_mpesa_phone ON public.mpesa_transactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_status ON public.mpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order ON public.mpesa_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_created ON public.mpesa_transactions(created_at);

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage mpesa" ON public.mpesa_transactions
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
--  TABLE: article_versions
--  Content versioning for audit trail and revert capability
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.article_versions (
  version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id BIGINT NOT NULL REFERENCES public.articles(article_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  version_number INT NOT NULL,
  created_by BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_article_versions_article ON public.article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_article_versions_created ON public.article_versions(created_at);

ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view versions" ON public.article_versions
  FOR SELECT USING (true);
CREATE POLICY "Authors can create versions" ON public.article_versions
  FOR INSERT WITH CHECK (auth.uid()::bigint = created_by OR EXISTS(
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- ─────────────────────────────────────────────────────────────────
--  TABLE: transaction_logs
--  Audit trail for payment and payout processing
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transaction_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID,
  mpesa_id UUID,
  transaction_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_tx_type CHECK (transaction_type IN ('payout', 'mpesa', 'stripe', 'paypal'))
);

CREATE INDEX IF NOT EXISTS idx_transaction_logs_payout ON public.transaction_logs(payout_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_type ON public.transaction_logs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created ON public.transaction_logs(created_at);

ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can log transactions" ON public.transaction_logs
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────
--  STORED PROCEDURE: process_payout
--  Atomically process payouts with transaction logging
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.process_payout(
  p_user_id BIGINT,
  p_amount NUMERIC,
  p_method TEXT
) RETURNS TABLE(payout_id UUID, status TEXT) AS $$
DECLARE
  v_payout_id UUID;
  v_error_msg TEXT;
BEGIN
  -- Generate payout ID
  v_payout_id := gen_random_uuid();

  -- Start transaction (implicit in stored procedure)

  -- Validate user exists
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create payout record
  BEGIN
    INSERT INTO public.payouts (id, user_id, amount, method, status, created_at)
    VALUES (v_payout_id, p_user_id, p_amount, p_method, 'processing', NOW());
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    INSERT INTO public.transaction_logs (payout_id, transaction_type, status, error_message)
    VALUES (v_payout_id, 'payout', 'failed', v_error_msg);
    RAISE;
  END;

  -- Deduct from user earnings
  BEGIN
    UPDATE public.earnings
    SET amount = amount - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND amount >= p_amount;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient earnings for payout';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    INSERT INTO public.transaction_logs (payout_id, transaction_type, status, error_message)
    VALUES (v_payout_id, 'payout', 'failed', v_error_msg);
    RAISE;
  END;

  -- Log successful payout initiation
  INSERT INTO public.transaction_logs (
    payout_id,
    transaction_type,
    status,
    details
  ) VALUES (
    v_payout_id,
    'payout',
    'initiated',
    jsonb_build_object(
      'user_id', p_user_id,
      'amount', p_amount,
      'method', p_method
    )
  );

  -- Return success
  RETURN QUERY SELECT v_payout_id, 'processing'::TEXT;

EXCEPTION WHEN OTHERS THEN
  -- Automatic ROLLBACK on error
  v_error_msg := SQLERRM;
  INSERT INTO public.transaction_logs (payout_id, transaction_type, status, error_message)
  VALUES (v_payout_id, 'payout', 'failed', v_error_msg);
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
--  TRIGGER: auto_article_version
--  Automatically create version on article update
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_create_article_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number INT;
  v_author_id BIGINT;
BEGIN
  -- Get current version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.article_versions
  WHERE article_id = NEW.article_id;

  -- Get current user
  SELECT user_id
  INTO v_author_id
  FROM public.users
  WHERE auth_id = auth.uid()
  LIMIT 1;

  -- If no user found, use article author
  IF v_author_id IS NULL THEN
    v_author_id := NEW.author_id;
  END IF;

  -- Create version record
  INSERT INTO public.article_versions (
    article_id,
    title,
    content,
    excerpt,
    version_number,
    created_by
  ) VALUES (
    NEW.article_id,
    NEW.title,
    NEW.content,
    NEW.excerpt,
    v_version_number,
    v_author_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_article_version ON public.articles;
CREATE TRIGGER trg_auto_article_version
  AFTER UPDATE OF title, content, excerpt ON public.articles
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title OR
        OLD.content IS DISTINCT FROM NEW.content OR
        OLD.excerpt IS DISTINCT FROM NEW.excerpt)
  EXECUTE FUNCTION public.auto_create_article_version();

-- ─────────────────────────────────────────────────────────────────
--  ADD COLUMNS: Improved payment and tracking
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS error_details JSONB;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS renewal_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────
--  INDEXES: Performance improvements
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON public.payouts(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON public.subscriptions(renewal_at);

-- ─────────────────────────────────────────────────────────────────
--  GRANT: Service role permissions
-- ─────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.process_payout TO service_role;

-- ================================================================
--  MIGRATION COMPLETE
--  Status: Ready for deployment
-- ================================================================
