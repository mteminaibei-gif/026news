-- Add recurring columns to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN recurring boolean NOT NULL DEFAULT true,
  ADD COLUMN next_billing_date timestamp NULL,
  ADD COLUMN cancelled_at timestamp NULL;
