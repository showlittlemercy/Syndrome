-- ============================================================================
-- SYNDROME PLATFORM - ROW LEVEL SECURITY (RLS) POLICIES
-- Granular security policies for data access control
-- ============================================================================

-- ============================================================================
-- PROFILES - RLS POLICIES
-- ============================================================================

-- Policy: Users can view all public profiles
CREATE POLICY "public_profiles_are_viewable"
ON profiles FOR SELECT
USING (true);

-- Policy: Users can update only their own profile
CREATE POLICY "users_can_update_own_profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (during signup)
CREATE POLICY "users_can_insert_own_profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "users_can_delete_own_profile"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- ============================================================================
-- POSTS - RLS POLICIES
-- ============================================================================

-- Policy: Users can view all public posts
CREATE POLICY "public_posts_are_viewable"
ON posts FOR SELECT
USING (true);

-- Policy: Users can insert posts only for themselves
CREATE POLICY "users_can_insert_own_posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own posts
CREATE POLICY "users_can_update_own_posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own posts
CREATE POLICY "users_can_delete_own_posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- LIKES - RLS POLICIES
-- ============================================================================

-- Policy: Users can view all likes (to show like counts)
CREATE POLICY "likes_are_viewable"
ON likes FOR SELECT
USING (true);

-- Policy: Users can like posts
CREATE POLICY "users_can_insert_likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove only their own likes
CREATE POLICY "users_can_delete_own_likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS - RLS POLICIES
-- ============================================================================

-- Policy: Users can view all comments
CREATE POLICY "comments_are_viewable"
ON comments FOR SELECT
USING (true);

-- Policy: Users can insert comments
CREATE POLICY "users_can_insert_comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own comments
CREATE POLICY "users_can_update_own_comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own comments
CREATE POLICY "users_can_delete_own_comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- FOLLOWS - RLS POLICIES
-- ============================================================================

-- Policy: Users can view all follows (to show follower/following counts)
CREATE POLICY "follows_are_viewable"
ON follows FOR SELECT
USING (true);

-- Policy: Users can follow others
CREATE POLICY "users_can_insert_follows"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow only themselves
CREATE POLICY "users_can_delete_own_follows"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- ============================================================================
-- MESSAGES - RLS POLICIES
-- ============================================================================

-- Policy: Users can view messages they sent
CREATE POLICY "users_can_view_sent_messages"
ON messages FOR SELECT
USING (auth.uid() = sender_id);

-- Policy: Users can view messages they received (1-on-1 chats)
CREATE POLICY "users_can_view_received_messages"
ON messages FOR SELECT
USING (auth.uid() = receiver_id);

-- Policy: Users can view group messages they are part of
CREATE POLICY "users_can_view_group_messages"
ON messages FOR SELECT
USING (
  group_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = messages.group_id
    AND user_id = auth.uid()
  )
);

-- Policy: Users can send messages
CREATE POLICY "users_can_send_messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own messages (mark as seen/delivered)
CREATE POLICY "users_can_update_messages"
ON messages FOR UPDATE
USING (
  auth.uid() = receiver_id OR
  auth.uid() = sender_id OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = messages.group_id
    AND user_id = auth.uid()
  ))
)
WITH CHECK (
  auth.uid() = receiver_id OR
  auth.uid() = sender_id OR
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = messages.group_id
    AND user_id = auth.uid()
  ))
);

-- Policy: Users can delete their own messages
CREATE POLICY "users_can_delete_own_messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================================================
-- GROUPS - RLS POLICIES
-- ============================================================================

-- Policy: Users can view groups they are members of
CREATE POLICY "users_can_view_joined_groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id
    AND user_id = auth.uid()
  )
);

-- Policy: Users can create groups
CREATE POLICY "users_can_create_groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Policy: Group owners/admins can update group details
CREATE POLICY "admins_can_update_groups"
ON groups FOR UPDATE
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Group owners can delete groups
CREATE POLICY "owners_can_delete_groups"
ON groups FOR DELETE
USING (auth.uid() = owner_id);

-- ============================================================================
-- GROUP_MEMBERS - RLS POLICIES
-- ============================================================================

-- Policy: Users can view group members of groups they are part of
CREATE POLICY "users_can_view_group_members"
ON group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members AS gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

-- Policy: Group owners/admins can add members
CREATE POLICY "admins_can_add_members"
ON group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_members.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
  OR auth.uid() = user_id
);

-- Policy: Group owners/admins can update member roles
CREATE POLICY "admins_can_update_members"
ON group_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_members.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_members.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Policy: Users can leave groups or admins can remove members
CREATE POLICY "users_can_leave_groups"
ON group_members FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = group_members.group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- PRESENCE - RLS POLICIES
-- ============================================================================

-- Policy: Users can view presence of all users
CREATE POLICY "presence_is_viewable"
ON presence FOR SELECT
USING (true);

-- Policy: Users can update their own presence
CREATE POLICY "users_can_update_own_presence"
ON presence FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their presence
CREATE POLICY "users_can_insert_presence"
ON presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own presence
CREATE POLICY "users_can_delete_own_presence"
ON presence FOR DELETE
USING (auth.uid() = user_id);
