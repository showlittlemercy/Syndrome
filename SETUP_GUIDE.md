# 🚀 Quick Setup Guide

## Step 1: Run Database Migrations

### Migration 1: Posts & Group Members (If Not Already Done)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/migration_fix_posts_and_groups.sql`
3. Paste and click **RUN**
4. Verify: No errors in output

### Migration 2: Comment Functions (NEW - REQUIRED)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `sql/migration_add_comment_functions.sql`
3. Paste and click **RUN**
4. Should see: `GRANT` success messages

---

## Step 2: Test Features

### Test 1: View Other User's Profile
1. Go to Home feed
2. Click on any post's username or avatar
3. ✅ Should navigate to their profile
4. ✅ Should see Follow and Message buttons
5. ✅ Should see their posts

### Test 2: Follow Someone
1. On another user's profile, click **Follow**
2. ✅ Button changes to "Following"
3. ✅ Follower count increases by 1
4. Click **Following** to unfollow
5. ✅ Button changes back to "Follow"
6. ✅ Follower count decreases by 1

### Test 3: Send Message
1. On another user's profile, click the Message button (envelope icon)
2. ✅ Should navigate to Messages page
3. ✅ Conversation with that user should be auto-selected
4. Type and send a message
5. ✅ Message appears in conversation

### Test 4: Add Comment
1. Go to Home feed
2. Click the comment icon on any post
3. ✅ Should navigate to post detail page
4. Type a comment in the input box
5. Click Send
6. ✅ Comment appears immediately
7. ✅ Comment count increases
8. Click your comment's delete icon
9. ✅ Comment is removed
10. ✅ Comment count decreases

### Test 5: Navigate from Comments
1. On post detail page with comments
2. Click on a commenter's username or avatar
3. ✅ Should navigate to their profile

---

## Expected Behavior

### Your Own Profile (`/profile`)
- Shows **Edit Profile** button
- Shows **Posts** and **Saved** tabs
- Can view and edit bio/name
- Shows all your stats

### Other User's Profile (`/profile/:userId`)
- Shows **Follow** button
- Shows **Message** button
- Shows **Posts** tab only (no Saved)
- Shows their stats (posts, followers, following)

### Post Detail Page (`/post/:postId`)
- Full post with like/save functionality
- Comment input at bottom
- All comments listed
- Can delete your own comments
- Clickable usernames → profiles

---

## Troubleshooting

### "Cannot read comments"
**Fix:** Run `migration_add_comment_functions.sql`

### "Profile not found"
**Fix:** Make sure user ID in URL is valid

### "Follow button not working"
**Fix:** Check if you're trying to follow yourself (not allowed)

### "Comments count not updating"
**Fix:** Verify migration ran successfully, check for RLS policy errors

---

## Quick Links

- Home: `/home`
- Your Profile: `/profile`
- Someone's Profile: `/profile/:userId`
- Post Detail: `/post/:postId`
- Messages: `/messages`
- Direct Message: `/messages?userId=:userId`

---

**Status:** Ready to test!
**Next:** Run both migrations, then test all features
