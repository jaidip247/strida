# MVP release checklist (Strida)

## Database / Supabase

- [ ] Apply migrations (including `009_user_plan_freemium.sql`) to staging and production.
- [ ] Deploy Edge Functions: `create-checkout-session`, `razorpay-webhook`, `push-reminders`.
- [ ] Set secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, `RAZORPAY_WEBHOOK_SECRET`, VAPID keys, `FCM_SERVER_KEY` (Android push, optional).

## Razorpay (India)

- [ ] Enable **Subscriptions** on the Razorpay account; create a **Plan** for Pro; set `RAZORPAY_PLAN_ID`.
- [ ] Add webhook URL (`/functions/v1/razorpay-webhook`); enable `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.completed`.
- [ ] Test checkout in test mode (cards/UPI per Razorpay test docs); confirm `User.plan` becomes `paid` and downgrades on cancel/complete webhooks.

## Web

- [ ] `PUBLIC_APP_URL` matches deployed origin (for Checkout redirects).
- [ ] Run `npm run build` and smoke test: register, 2 habits on free, 3rd blocked, Insights redirects to upgrade, checkout success.

## Android (Capacitor)

- [ ] `npm run build:mobile && npx cap sync android`; open in Android Studio; release build on device.
- [ ] See [MVP_ANDROID_BILLING.md](./MVP_ANDROID_BILLING.md).

## Accessibility / copy

- [ ] Spot-check keyboard focus on Settings and Upgrade.
- [ ] Marketing limits match product (2 habits, 21-day free).
