-- ============================================================================
-- MIGRATION: Add Comment Count Functions
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts
  SET comments_count = comments_count + 1
  WHERE id = post_id;
END;
$$;

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posts
  SET comments_count = GREATEST(0, comments_count - 1)
  WHERE id = post_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_comments_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comments_count(UUID) TO authenticated;

-- Verification
SELECT proname, proargtypes, prosrc 
FROM pg_proc 
WHERE proname IN ('increment_comments_count', 'decrement_comments_count');
