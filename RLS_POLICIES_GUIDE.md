# Row Level Security (RLS) Policies Guide

## What is Row Level Security?

Row Level Security (RLS) is a PostgreSQL feature that allows you to control access to individual rows in a table based on the user executing the query. In Supabase, this is essential for ensuring users can only access their own data.

## How RLS Works

1. **Enable RLS** on a table: `ALTER TABLE "TableName" ENABLE ROW LEVEL SECURITY;`
2. **Create Policies** that define who can access what data
3. **Use `auth.uid()`** to get the current authenticated user's ID

## Policy Structure

```sql
CREATE POLICY "policy_name"
ON "table_name"
FOR operation  -- SELECT, INSERT, UPDATE, DELETE, or ALL
USING (condition)  -- For SELECT, UPDATE, DELETE
WITH CHECK (condition)  -- For INSERT, UPDATE
```

## Key Functions

- `auth.uid()` - Returns the UUID of the currently authenticated user
- `auth.role()` - Returns the role of the current user (usually 'authenticated' or 'anon')

## Your Schema Policies

### User Table
- **SELECT**: Users can only view their own profile (`auth.uid() = id`)
- **UPDATE**: Users can only update their own profile
- **INSERT**: Users can only insert their own profile

### Schedule Table
- **SELECT**: Users can only view schedules where `user_id = auth.uid()`
- **INSERT**: Users can only create schedules with their own `user_id`
- **UPDATE**: Users can only update their own schedules
- **DELETE**: Users can only delete their own schedules

### Habit Table
- **SELECT**: Users can only view habits that belong to their schedules (via join)
- **INSERT**: Users can only create habits in schedules they own
- **UPDATE**: Users can only update habits in their schedules
- **DELETE**: Users can only delete habits from their schedules

## How to Apply These Policies

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from `supabase/migrations/002_enable_rls_policies.sql`
4. Run the query

### Option 2: Via Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual Setup
1. Go to **Authentication** → **Policies** in Supabase Dashboard
2. For each table, click **New Policy**
3. Follow the policy structure above

## Testing RLS Policies

After applying policies, test them:

```sql
-- As authenticated user, you should only see your own data
SELECT * FROM "Schedule" WHERE user_id = auth.uid();

-- This should return only your schedules
SELECT * FROM "Habit" 
WHERE schedule_id IN (
  SELECT id FROM "Schedule" WHERE user_id = auth.uid()
);
```

## Common Issues

### Issue: "Permission denied" errors
**Solution**: Make sure:
1. RLS is enabled on the table
2. Policies are created for the operation you're trying to perform
3. The user is authenticated (`auth.uid()` is not null)

### Issue: Can't insert data
**Solution**: Check that:
1. `WITH CHECK` condition in INSERT policy matches your data
2. Foreign key relationships are satisfied
3. User ID matches `auth.uid()`

### Issue: Can't see related data
**Solution**: For joins (like Habit → Schedule), make sure:
1. The policy uses `EXISTS` subquery to check ownership
2. The join condition is correct in the policy

## Best Practices

1. **Always enable RLS** on tables with user data
2. **Test policies** with different user accounts
3. **Use `auth.uid()`** consistently for user identification
4. **Document policies** so team members understand access rules
5. **Use `EXISTS` subqueries** for checking relationships across tables

## Example: Querying with RLS

When you query from your app, Supabase automatically applies RLS:

```javascript
// This will only return schedules for the authenticated user
const { data, error } = await supabase
  .from('Schedule')
  .select('*');

// This will only return habits from the user's schedules
const { data, error } = await supabase
  .from('Habit')
  .select('*, Schedule(*)');
```

RLS policies are applied automatically - you don't need to add `WHERE user_id = auth.uid()` in your queries!

