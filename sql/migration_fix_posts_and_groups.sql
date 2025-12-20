-- ============================================================================
-- MIGRATION: Fix Posts Table + Group Members RLS Policy
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ====================
-- FIX 1: Allow text-only posts (make image_url nullable)
-- ====================

-- Step 1: Drop the NOT NULL constraint on image_url
ALTER TABLE posts ALTER COLUMN image_url DROP NOT NULL;

-- Step 2: Add CHECK constraint to ensure either image or caption exists (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_image_or_caption'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_image_or_caption 
      CHECK (image_url IS NOT NULL OR caption IS NOT NULL);
    RAISE NOTICE '✅ Added posts_image_or_caption constraint';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint posts_image_or_caption already exists';
  END IF;
END $$;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'image_url';


-- ====================
-- FIX 2: Fix infinite recursion in group_members RLS policies
-- ====================

-- Drop ALL problematic group_members policies that cause infinite recursion
-- Since the app uses 1-to-1 messaging only (no groups), these are not needed
DROP POLICY IF EXISTS "users_can_view_group_members" ON group_members;
DROP POLICY IF EXISTS "admins_can_add_members" ON group_members;
DROP POLICY IF EXISTS "admins_can_update_members" ON group_members;
DROP POLICY IF EXISTS "users_can_leave_groups" ON group_members;

-- Done! Verify policies removed
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'group_members';
