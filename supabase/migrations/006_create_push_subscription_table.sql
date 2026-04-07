-- Push notification subscriptions for web and mobile clients
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys_p256dh TEXT,
    keys_auth TEXT,
    platform TEXT NOT NULL DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscription_user ON "PushSubscription"(user_id);

ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
ON "PushSubscription"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
ON "PushSubscription"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
ON "PushSubscription"
FOR DELETE
USING (auth.uid() = user_id);
