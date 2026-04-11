# Android (Capacitor) and billing

## MVP approach

- **Subscriptions** are sold with **Razorpay** (hosted subscription checkout from Edge Function `create-checkout-session`). The Android app is a WebView of the same Svelte app; users can open **Settings → Upgrade to Pro** or **/app/upgrade** and complete checkout in the system browser or embedded web view, depending on device behavior. Razorpay supports Indian **credit and debit cards** (Visa, Mastercard, RuPay), UPI, netbanking, and wallets per your Razorpay account settings.
- **Google Play Billing** is not integrated in this MVP. If you later distribute on Google Play and sell digital subscriptions, you will likely need **Play Billing** for that store’s policies—plan a follow-up before a wide Play launch.

## What to test on Android

- Log in, open **Upgrade**, complete a **test** Razorpay subscription authorization (test mode keys), return to the app, confirm **Settings** shows Pro and Insights/Progress are available.
- Reminders: grant notification permission; confirm tokens sync (same as web).

## Environment

Configure the same Supabase and Razorpay secrets as production web; deploy Edge Functions `create-checkout-session` and `razorpay-webhook` and register the webhook URL in the Razorpay Dashboard.
