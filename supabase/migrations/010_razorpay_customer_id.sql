-- Billing: Razorpay customer id (Indian payment gateway; replaces Stripe column from 009)

ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS razorpay_customer_id text;

COMMENT ON COLUMN public."User".razorpay_customer_id IS 'Razorpay customer id for subscription billing (set by razorpay-webhook).';

ALTER TABLE public."User" DROP COLUMN IF EXISTS stripe_customer_id;
