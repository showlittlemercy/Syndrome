-- ============================================================================
-- MIGRATION: Add Notifications System
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create indexes for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "users_can_view_own_notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "users_can_update_own_notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System can create notifications (authenticated users)
CREATE POLICY "authenticated_can_create_notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Function to create notification for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user liked their own post
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
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't create notification if user commented on their own post
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

-- Create triggers
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

DROP TRIGGER IF EXISTS trigger_unlike_notification ON likes;
CREATE TRIGGER trigger_unlike_notification
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION delete_like_notification();

DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

DROP TRIGGER IF EXISTS trigger_unfollow_notification ON follows;
CREATE TRIGGER trigger_unfollow_notification
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION delete_follow_notification();

-- Function to get unread notification count
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

-- Verification
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notifications') as column_count
FROM information_schema.tables 
WHERE table_name = 'notifications';

SELECT COUNT(*) as trigger_count 
FROM pg_trigger 
WHERE tgname LIKE '%notification%';
