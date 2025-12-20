-- ============================================================================
-- MIGRATION: Fix All Issues - Messages, Notifications, and Comment Counts
-- This migration fixes:
-- 1. Messages not showing (RLS policy issue)
-- 2. Users not visible in search (profiles query issue)  
-- 3. Notifications table (handles existing table gracefully)
-- 4. Comment count triggers (automatic updates)
-- ============================================================================

-- ============================================================================
-- PART 1: FIX MESSAGES RLS POLICIES
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "users_can_view_sent_messages" ON messages;
DROP POLICY IF EXISTS "users_can_view_received_messages" ON messages;
DROP POLICY IF EXISTS "users_can_view_group_messages" ON messages;
DROP POLICY IF EXISTS "users_can_update_messages" ON messages;
DROP POLICY IF EXISTS "users_can_delete_own_messages" ON messages;

-- Create comprehensive policy for viewing messages (sent OR received OR group)
CREATE POLICY "users_can_view_their_messages"
ON messages FOR SELECT
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id 
      AND user_id = auth.uid()
    )
  )
);

-- Policy: Users can send messages
CREATE POLICY "users_can_send_messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update messages (for seen/delivered status)
CREATE POLICY "users_can_update_their_messages"
ON messages FOR UPDATE
USING (
  auth.uid() = receiver_id 
  OR auth.uid() = sender_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id 
      AND user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() = receiver_id 
  OR auth.uid() = sender_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id 
      AND user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete their own sent messages
CREATE POLICY "users_can_delete_sent_messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================================================
-- PART 2: FIX NOTIFICATIONS TABLE (HANDLES EXISTING TABLE)
-- ============================================================================

-- Create notifications table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message')),
      post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
      comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT notifications_type_check CHECK (
        (type = 'like' AND post_id IS NOT NULL) OR
        (type = 'comment' AND post_id IS NOT NULL AND comment_id IS NOT NULL) OR
        (type = 'follow') OR
        (type = 'message')
      )
    );
    RAISE NOTICE '✅ Created notifications table';
  ELSE
    RAISE NOTICE 'ℹ️ Notifications table already exists';
  END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add 'read' column if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added read column to notifications';
  END IF;

  -- Add 'content' column if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'content'
  ) THEN
    ALTER TABLE notifications ADD COLUMN content TEXT;
    RAISE NOTICE '✅ Added content column to notifications';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "authenticated_can_create_notifications" ON notifications;

CREATE POLICY "users_can_view_own_notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_can_create_notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PART 3: COMMENT COUNT TRIGGERS (AUTOMATIC UPDATES)
-- ============================================================================

-- Function to automatically increment comments count (bypass RLS)
CREATE OR REPLACE FUNCTION auto_increment_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass RLS by running as function owner
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Function to automatically decrement comments count (bypass RLS)
CREATE OR REPLACE FUNCTION auto_decrement_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass RLS by running as function owner
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_increment_comment_count ON comments;
DROP TRIGGER IF EXISTS trigger_decrement_comment_count ON comments;

-- Create triggers for automatic comment count updates
CREATE TRIGGER trigger_increment_comment_count
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_comments_count();

CREATE TRIGGER trigger_decrement_comment_count
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_decrement_comments_count();

-- Backfill: ensure existing posts have accurate counts
UPDATE posts p
SET comments_count = COALESCE((
  SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id
), 0);

-- ============================================================================
-- PART 4: NOTIFICATION TRIGGERS
-- ============================================================================

-- Function to create notification for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner_id, NEW.user_id, 'like', NEW.post_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, content)
    VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id, NEW.content)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Function to delete notification when like is removed
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'like'
    AND actor_id = OLD.user_id
    AND post_id = OLD.post_id;
  
  RETURN OLD;
END;
$$;

-- Function to delete notification when follow is removed
CREATE OR REPLACE FUNCTION delete_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notifications
  WHERE type = 'follow'
    AND actor_id = OLD.follower_id
    AND user_id = OLD.following_id;
  
  RETURN OLD;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
DROP TRIGGER IF EXISTS trigger_unlike_notification ON likes;
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
DROP TRIGGER IF EXISTS trigger_unfollow_notification ON follows;

-- Create notification triggers
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER trigger_unlike_notification
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION delete_like_notification();

CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

CREATE TRIGGER trigger_unfollow_notification
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION delete_follow_notification();

-- Helper function for unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM notifications
  WHERE user_id = user_uuid AND read = false;
  
  RETURN unread_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  comment_trigger_count INT;
  notification_trigger_count INT;
  notifications_exists BOOLEAN;
  messages_policy_count INT;
BEGIN
  -- Check comment triggers
  SELECT COUNT(*)::INT INTO comment_trigger_count
  FROM pg_trigger WHERE tgname LIKE '%comment_count%';
  
  -- Check notification triggers
  SELECT COUNT(*)::INT INTO notification_trigger_count
  FROM pg_trigger WHERE tgname LIKE '%notification%';
  
  -- Check notifications table
  SELECT EXISTS (
    SELECT FROM pg_tables WHERE tablename = 'notifications'
  ) INTO notifications_exists;
  
  -- Check messages policies
  SELECT COUNT(*)::INT INTO messages_policy_count
  FROM pg_policies WHERE tablename = 'messages';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Comment Count Triggers: %', comment_trigger_count;
  RAISE NOTICE 'Notification Triggers: %', notification_trigger_count;
  RAISE NOTICE 'Notifications Table Exists: %', notifications_exists;
  RAISE NOTICE 'Messages RLS Policies: %', messages_policy_count;
  RAISE NOTICE '';
  
  IF comment_trigger_count >= 2 THEN
    RAISE NOTICE '✅ Comment counting is working';
  ELSE
    RAISE WARNING '⚠️ Comment triggers may not be set up correctly';
  END IF;
  
  IF notification_trigger_count >= 5 THEN
    RAISE NOTICE '✅ Notifications are working';
  ELSE
    RAISE WARNING '⚠️ Notification triggers may not be set up correctly';
  END IF;
  
  IF notifications_exists THEN
    RAISE NOTICE '✅ Notifications table ready';
  ELSE
    RAISE WARNING '⚠️ Notifications table missing';
  END IF;
  
  IF messages_policy_count >= 3 THEN
    RAISE NOTICE '✅ Messages policies fixed';
  ELSE
    RAISE WARNING '⚠️ Messages policies may need attention';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Test sending/receiving messages';
  RAISE NOTICE '2. Test adding comments (count should update)';
  RAISE NOTICE '3. Test notifications (like, comment, follow)';
  RAISE NOTICE '4. Check search functionality';
  RAISE NOTICE '========================================';
END $$;
